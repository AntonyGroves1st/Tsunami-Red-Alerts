import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UniversalCrypto } from '@/utils/crypto';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkBlockedPerson, monitorUnauthorizedLaunch, retryQueuedNotifications } from '@/services/ownershipProtection';

const AUTH_USER_KEY = 'emperial_auth_user';
const AUTH_SESSION_KEY = 'emperial_auth_session';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  avatarInitials: string;
  isMember: boolean;
  memberSince?: number;
  plan?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: number;
  isAdmin?: boolean;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isMember: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  upgradeMembership: (plan: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  checkEmailExists: (email: string) => Promise<{ exists: boolean; displayName?: string }>;
  getAllUsers: () => Promise<UserProfile[]>;
  updateUserPlan: (email: string, plan: string, isMember: boolean) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  setUserAdmin: (email: string, isAdmin: boolean) => Promise<void>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function hashPassword(password: string): Promise<string> {
  const digest = await UniversalCrypto.digestStringAsync(password + 'emperial_salt_v1');
  return digest;
}

const ADMIN_EMAIL = 'admin@emperialbot.com';
const ADMIN_DISPLAY_NAME = 'EMPERIAL Admin';
const ADMIN_PASSWORD = 'Emperial@2024!Secure';

async function seedAdminAccount(): Promise<void> {
  try {
    const existingUsers = await AsyncStorage.getItem('emperial_users_db');
    const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
    
    const adminKey = ADMIN_EMAIL.toLowerCase();
    if (!usersDb[adminKey]) {
      console.log('[Auth] Seeding admin account...');
      const passwordHash = await hashPassword(ADMIN_PASSWORD);
      const adminProfile: UserProfile = {
        id: 'admin-001',
        email: adminKey,
        displayName: ADMIN_DISPLAY_NAME,
        createdAt: Date.now(),
        avatarInitials: 'AD',
        isMember: true,
        memberSince: Date.now(),
        plan: 'lifetime',
        emailVerified: true,
        emailVerifiedAt: Date.now(),
        isAdmin: true,
      };
      usersDb[adminKey] = { passwordHash, profile: adminProfile };
      await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      console.log('[Auth] Admin account seeded successfully');
    } else if (!usersDb[adminKey].profile.isAdmin) {
      usersDb[adminKey].profile.isAdmin = true;
      usersDb[adminKey].profile.isMember = true;
      usersDb[adminKey].profile.plan = 'lifetime';
      await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      console.log('[Auth] Existing admin account updated with admin flag');
    }
  } catch (e) {
    console.error('[Auth] Failed to seed admin account:', e);
  }
}

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    seedAdminAccount();
  }, []);

  const userQuery = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      console.log('[Auth] Loading stored user...');
      try {
        const stored = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          console.log('[Auth] User loaded:', parsed.email);
          return parsed;
        }
      } catch (e) {
        console.error('[Auth] Failed to load user:', e);
      }
      return null;
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
      if (userQuery.data?.email) {
        monitorUnauthorizedLaunch(userQuery.data.email).catch(() => {});
        retryQueuedNotifications().catch(() => {});
      }
    }
  }, [userQuery.data]);

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
      console.log('[Auth] Signing up:', email);

      const blocked = await checkBlockedPerson(email, displayName);
      if (blocked.blocked) {
        console.log('[Auth] BLOCKED PERSON attempted signup:', email, displayName);
        throw new Error(blocked.reason ?? 'This account has been permanently blocked.');
      }

      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};

      if (usersDb[email.toLowerCase()]) {
        throw new Error('An account with this email already exists');
      }

      const passwordHash = await hashPassword(password);
      const newUser: UserProfile = {
        id: UniversalCrypto.randomUUID(),
        email: email.toLowerCase().trim(),
        displayName: displayName.trim(),
        createdAt: Date.now(),
        avatarInitials: getInitials(displayName),
        isMember: false,
        emailVerified: true,
        emailVerifiedAt: Date.now(),
      };

      usersDb[email.toLowerCase()] = { passwordHash, profile: newUser };
      await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      await AsyncStorage.setItem(AUTH_SESSION_KEY, Date.now().toString());

      console.log('[Auth] Sign up successful:', newUser.email);
      return newUser;
    },
    onSuccess: (newUser) => {
      setUser(newUser);
      queryClient.setQueryData(['auth-user'], newUser);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('[Auth] Logging in:', email);

      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};

      const record = usersDb[email.toLowerCase()];
      if (!record) {
        throw new Error('No account found with this email');
      }

      const blocked = await checkBlockedPerson(email, record.profile.displayName);
      if (blocked.blocked) {
        console.log('[Auth] BLOCKED PERSON attempted login:', email);
        throw new Error(blocked.reason ?? 'This account has been permanently blocked.');
      }

      const passwordHash = await hashPassword(password);
      if (passwordHash !== record.passwordHash) {
        throw new Error('Incorrect password');
      }

      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(record.profile));
      await AsyncStorage.setItem(AUTH_SESSION_KEY, Date.now().toString());

      console.log('[Auth] Login successful:', record.profile.email);
      return record.profile;
    },
    onSuccess: (loggedInUser) => {
      setUser(loggedInUser);
      queryClient.setQueryData(['auth-user'], loggedInUser);
      monitorUnauthorizedLaunch(loggedInUser.email).catch(() => {});
      retryQueuedNotifications().catch(() => {});
    },
  });

  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email.includes('@') || email.length < 5) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      if (displayName.trim().length < 2) {
        return { success: false, error: 'Please enter your name' };
      }
      await signUpMutation.mutateAsync({ email, password, displayName });
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      return { success: false, error: msg };
    }
  }, [signUpMutation]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!password) {
        return { success: false, error: 'Please enter your password' };
      }
      await loginMutation.mutateAsync({ email, password });
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Login failed';
      return { success: false, error: msg };
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out');
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    setUser(null);
    queryClient.setQueryData(['auth-user'], null);
  }, [queryClient]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    if (updates.displayName) {
      updated.avatarInitials = getInitials(updates.displayName);
    }
    setUser(updated);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    queryClient.setQueryData(['auth-user'], updated);

    const existingUsers = await AsyncStorage.getItem('emperial_users_db');
    if (existingUsers) {
      const usersDb = JSON.parse(existingUsers);
      if (usersDb[user.email]) {
        usersDb[user.email].profile = updated;
        await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      }
    }
    console.log('[Auth] Profile updated');
  }, [user, queryClient]);

  const upgradeMembership = useCallback(async (plan: string) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      isMember: true,
      memberSince: Date.now(),
      plan,
    };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    queryClient.setQueryData(['auth-user'], updated);

    const existingUsers = await AsyncStorage.getItem('emperial_users_db');
    if (existingUsers) {
      const usersDb = JSON.parse(existingUsers);
      if (usersDb[user.email]) {
        usersDb[user.email].profile = updated;
        await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      }
    }
    console.log('[Auth] Membership upgraded to:', plan);
  }, [user, queryClient]);

  const checkEmailExists = useCallback(async (email: string): Promise<{ exists: boolean; displayName?: string }> => {
    try {
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      const record = usersDb[email.toLowerCase()];
      if (record) {
        return { exists: true, displayName: record.profile.displayName };
      }
      return { exists: false };
    } catch (e) {
      console.error('[Auth] checkEmailExists error:', e);
      return { exists: false };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!email.includes('@') || email.length < 5) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (newPassword.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      const record = usersDb[email.toLowerCase()];
      if (!record) {
        return { success: false, error: 'No account found with this email' };
      }
      const newHash = await hashPassword(newPassword);
      usersDb[email.toLowerCase()].passwordHash = newHash;
      await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      console.log('[Auth] Password reset successful for:', email);
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Password reset failed';
      console.error('[Auth] resetPassword error:', msg);
      return { success: false, error: msg };
    }
  }, []);

  const getAllUsers = useCallback(async (): Promise<UserProfile[]> => {
    try {
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      return Object.values(usersDb).map(r => r.profile);
    } catch (e) {
      console.error('[Auth] getAllUsers error:', e);
      return [];
    }
  }, []);

  const updateUserPlan = useCallback(async (email: string, plan: string, isMember: boolean) => {
    try {
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      const record = usersDb[email.toLowerCase()];
      if (record) {
        record.profile.plan = plan;
        record.profile.isMember = isMember;
        if (isMember && !record.profile.memberSince) {
          record.profile.memberSince = Date.now();
        }
        usersDb[email.toLowerCase()] = record;
        await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
        if (user?.email === email.toLowerCase()) {
          setUser(record.profile);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(record.profile));
          queryClient.setQueryData(['auth-user'], record.profile);
        }
        console.log('[Auth] Updated plan for', email, 'to', plan);
      }
    } catch (e) {
      console.error('[Auth] updateUserPlan error:', e);
    }
  }, [user, queryClient]);

  const deleteUser = useCallback(async (email: string) => {
    try {
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      delete usersDb[email.toLowerCase()];
      await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
      console.log('[Auth] Deleted user:', email);
    } catch (e) {
      console.error('[Auth] deleteUser error:', e);
    }
  }, []);

  const setUserAdmin = useCallback(async (email: string, isAdminFlag: boolean) => {
    try {
      const existingUsers = await AsyncStorage.getItem('emperial_users_db');
      const usersDb: Record<string, { passwordHash: string; profile: UserProfile }> = existingUsers ? JSON.parse(existingUsers) : {};
      const record = usersDb[email.toLowerCase()];
      if (record) {
        record.profile.isAdmin = isAdminFlag;
        usersDb[email.toLowerCase()] = record;
        await AsyncStorage.setItem('emperial_users_db', JSON.stringify(usersDb));
        console.log('[Auth] Set admin for', email, 'to', isAdminFlag);
      }
    } catch (e) {
      console.error('[Auth] setUserAdmin error:', e);
    }
  }, []);

  const isAuthenticated = !!user;
  const isMember = !!user?.isMember;
  const isAdmin = !!user?.isAdmin;

  return {
    user,
    isAuthenticated,
    isLoading: userQuery.isLoading,
    isMember,
    isAdmin,
    signUp,
    login,
    logout,
    updateProfile,
    upgradeMembership,
    resetPassword,
    checkEmailExists,
    getAllUsers,
    updateUserPlan,
    deleteUser,
    setUserAdmin,
  };
});
