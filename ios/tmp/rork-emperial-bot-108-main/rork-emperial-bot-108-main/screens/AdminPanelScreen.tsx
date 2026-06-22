import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import {
  X,
  Users,
  Crown,
  Shield,
  ShieldCheck,
  Trash2,
  ChevronDown,
  ChevronUp,
  Search,
  UserCog,
  BarChart3,
  TrendingUp,
  Lock,
  Unlock,
  Star,
  Zap,
  Diamond,
  CircleDollarSign,
  Clock,
  Mail,
  AlertTriangle,
} from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';

type PlanFilter = 'all' | 'free' | 'starter' | 'pro' | 'premium' | 'elite' | 'lifetime';

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'premium', 'elite', 'lifetime'] as const;

function getPlanColor(plan?: string): string {
  switch (plan) {
    case 'starter': return Colors.blue;
    case 'pro': return Colors.amber;
    case 'premium': return Colors.gold;
    case 'elite': return Colors.purple;
    case 'lifetime': return Colors.cyan;
    default: return Colors.text3;
  }
}

function getPlanIcon(plan?: string) {
  const color = getPlanColor(plan);
  const size = 14;
  switch (plan) {
    case 'starter': return <Zap size={size} color={color} />;
    case 'pro': return <TrendingUp size={size} color={color} />;
    case 'premium': return <Crown size={size} color={color} />;
    case 'elite': return <Diamond size={size} color={color} />;
    case 'lifetime': return <Star size={size} color={color} />;
    default: return <Lock size={size} color={color} />;
  }
}

interface UserCardProps {
  profile: UserProfile;
  onChangePlan: (email: string, plan: string) => void;
  onToggleAdmin: (email: string, isAdmin: boolean) => void;
  onDelete: (email: string) => void;
  currentUserEmail: string;
}

function UserCard({ profile, onChangePlan, onToggleAdmin, onDelete, currentUserEmail }: UserCardProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelf = profile.email === currentUserEmail;

  const toggleExpand = () => {
    Haptics.impact('light');
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.98, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    setExpanded(!expanded);
    Animated.timing(heightAnim, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const planLabel = profile.isMember ? (profile.plan ?? 'member') : 'free';
  const planColor = getPlanColor(profile.plan);

  return (
    <Animated.View style={[styles.userCard, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable onPress={toggleExpand} style={styles.userCardHeader}>
        <View style={[styles.userAvatar, { borderColor: profile.isAdmin ? Colors.red : planColor }]}>
          <Text style={[styles.userAvatarText, { color: profile.isAdmin ? Colors.red : planColor }]}>
            {profile.avatarInitials}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userNameText} numberOfLines={1}>{profile.displayName}</Text>
            {profile.isAdmin && (
              <View style={styles.adminTag}>
                <ShieldCheck size={10} color={Colors.red} />
                <Text style={styles.adminTagText}>ADMIN</Text>
              </View>
            )}
          </View>
          <Text style={styles.userEmailText} numberOfLines={1}>{profile.email}</Text>
          <View style={styles.userMetaRow}>
            {getPlanIcon(profile.isMember ? profile.plan : undefined)}
            <Text style={[styles.planBadgeText, { color: planColor }]}>
              {planLabel.charAt(0).toUpperCase() + planLabel.slice(1)}
            </Text>
            <Text style={styles.userJoinText}>Joined {joinDate}</Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={Colors.text3} />
        ) : (
          <ChevronDown size={18} color={Colors.text3} />
        )}
      </Pressable>

      {expanded && (
        <Animated.View style={styles.userActions}>
          <View style={styles.actionDivider} />

          <Text style={styles.actionSectionLabel}>Change Plan</Text>
          <View style={styles.planGrid}>
            {PLAN_OPTIONS.map((p) => {
              const isActive = (p === 'free' && !profile.isMember) || (profile.isMember && profile.plan === p);
              const color = getPlanColor(p === 'free' ? undefined : p);
              return (
                <Pressable
                  key={p}
                  onPress={() => {
                    Haptics.impact('medium');
                    onChangePlan(profile.email, p);
                  }}
                  style={[
                    styles.planChip,
                    isActive && { borderColor: color, backgroundColor: color + '15' },
                  ]}
                >
                  <Text style={[
                    styles.planChipText,
                    isActive && { color },
                  ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={() => {
                Haptics.impact('medium');
                onToggleAdmin(profile.email, !profile.isAdmin);
              }}
              style={[styles.actionBtn, { borderColor: Colors.amber + '40', backgroundColor: Colors.amber + '08' }]}
              disabled={isSelf}
            >
              {profile.isAdmin ? <Shield size={14} color={Colors.amber} /> : <ShieldCheck size={14} color={Colors.amber} />}
              <Text style={[styles.actionBtnText, { color: Colors.amber }]}>
                {profile.isAdmin ? 'Remove Admin' : 'Make Admin'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impact('heavy');
                onDelete(profile.email);
              }}
              style={[styles.actionBtn, { borderColor: Colors.red + '40', backgroundColor: Colors.red + '08' }]}
              disabled={isSelf}
            >
              <Trash2 size={14} color={isSelf ? Colors.text3 : Colors.red} />
              <Text style={[styles.actionBtnText, { color: isSelf ? Colors.text3 : Colors.red }]}>
                Delete
              </Text>
            </Pressable>
          </View>

          {isSelf && (
            <Text style={styles.selfNote}>You cannot modify your own admin status or delete yourself</Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, getAllUsers, updateUserPlan, deleteUser, setUserAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [filterPlan, setFilterPlan] = useState<PlanFilter>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadUsers = useCallback(async () => {
    console.log('[Admin] Loading all users...');
    const allUsers = await getAllUsers();
    setUsers(allUsers);
    setLoading(false);
    setRefreshing(false);
    console.log('[Admin] Loaded', allUsers.length, 'users');
  }, [getAllUsers]);

  useEffect(() => {
    loadUsers();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [loadUsers, fadeAnim]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleChangePlan = useCallback(async (email: string, plan: string) => {
    const isMember = plan !== 'free';
    await updateUserPlan(email, plan, isMember);
    await loadUsers();
    Haptics.notification('success');
  }, [updateUserPlan, loadUsers]);

  const handleToggleAdmin = useCallback(async (email: string, isAdmin: boolean) => {
    Alert.alert(
      isAdmin ? 'Grant Admin' : 'Remove Admin',
      `Are you sure you want to ${isAdmin ? 'grant admin access to' : 'remove admin access from'} ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: isAdmin ? 'default' : 'destructive',
          onPress: async () => {
            await setUserAdmin(email, isAdmin);
            await loadUsers();
            Haptics.notification('success');
          },
        },
      ]
    );
  }, [setUserAdmin, loadUsers]);

  const handleDeleteUser = useCallback(async (email: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${email}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteUser(email);
            await loadUsers();
            Haptics.notification('warning');
          },
        },
      ]
    );
  }, [deleteUser, loadUsers]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchText ||
      u.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase());

    let matchesPlan = true;
    if (filterPlan !== 'all') {
      if (filterPlan === 'free') {
        matchesPlan = !u.isMember;
      } else {
        matchesPlan = u.isMember && u.plan === filterPlan;
      }
    }

    return matchesSearch && matchesPlan;
  });

  const stats = {
    total: users.length,
    free: users.filter(u => !u.isMember).length,
    paid: users.filter(u => u.isMember).length,
    admins: users.filter(u => u.isAdmin).length,
    lifetime: users.filter(u => u.plan === 'lifetime').length,
    elite: users.filter(u => u.plan === 'elite').length,
  };

  if (!user?.isAdmin) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.accessDenied}>
          <AlertTriangle size={48} color={Colors.red} />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>You do not have admin privileges.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => {
            Haptics.impact('light');
            router.back();
          }}
          style={styles.closeBtn}
          hitSlop={12}
        >
          <X size={22} color={Colors.white} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ShieldCheck size={18} color={Colors.red} />
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.amber} />
          }
        >
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderColor: Colors.blue + '30' }]}>
              <Users size={18} color={Colors.blue} />
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.green + '30' }]}>
              <CircleDollarSign size={18} color={Colors.green} />
              <Text style={styles.statNumber}>{stats.paid}</Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.text3 + '30' }]}>
              <Lock size={18} color={Colors.text3} />
              <Text style={styles.statNumber}>{stats.free}</Text>
              <Text style={styles.statLabel}>Free</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.red + '30' }]}>
              <ShieldCheck size={18} color={Colors.red} />
              <Text style={styles.statNumber}>{stats.admins}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.cyan + '30' }]}>
              <Star size={18} color={Colors.cyan} />
              <Text style={styles.statNumber}>{stats.lifetime}</Text>
              <Text style={styles.statLabel}>Lifetime</Text>
            </View>
            <View style={[styles.statCard, { borderColor: Colors.purple + '30' }]}>
              <Diamond size={18} color={Colors.purple} />
              <Text style={styles.statNumber}>{stats.elite}</Text>
              <Text style={styles.statLabel}>Elite</Text>
            </View>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Search size={16} color={Colors.text3} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                placeholderTextColor={Colors.text3}
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
                testID="admin-search"
              />
            </View>
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                setShowFilters(!showFilters);
              }}
              style={[styles.filterToggle, showFilters && { backgroundColor: Colors.amber + '15', borderColor: Colors.amber + '40' }]}
            >
              <BarChart3 size={16} color={showFilters ? Colors.amber : Colors.text3} />
            </Pressable>
          </View>

          {showFilters && (
            <View style={styles.filterRow}>
              {(['all', 'free', 'starter', 'pro', 'premium', 'elite', 'lifetime'] as PlanFilter[]).map((f) => {
                const isActive = filterPlan === f;
                const color = f === 'all' ? Colors.white : getPlanColor(f === 'free' ? undefined : f);
                return (
                  <Pressable
                    key={f}
                    onPress={() => {
                      Haptics.impact('light');
                      setFilterPlan(f);
                    }}
                    style={[styles.filterChip, isActive && { borderColor: color, backgroundColor: color + '15' }]}
                  >
                    <Text style={[styles.filterChipText, isActive && { color }]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.usersHeader}>
            <Text style={styles.usersTitle}>
              Users ({filteredUsers.length})
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.amber} style={{ marginTop: 32 }} />
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={32} color={Colors.text3} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            filteredUsers.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                onChangePlan={handleChangePlan}
                onToggleAdmin={handleToggleAdmin}
                onDelete={handleDeleteUser}
                currentUserEmail={user?.email ?? ''}
              />
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '31%' as any,
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    gap: 6,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  searchSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: 14,
    gap: 10,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.white,
    height: 44,
  },
  filterToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  usersHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  usersTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  userCard: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginBottom: 10,
    overflow: 'hidden' as const,
  },
  userCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 14,
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.bg3,
    borderWidth: 1.5,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    flexShrink: 1,
  },
  adminTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
    backgroundColor: Colors.red + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminTagText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: Colors.red,
    letterSpacing: 0.5,
  },
  userEmailText: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: 4,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  userJoinText: {
    fontSize: 10,
    color: Colors.text3,
    marginLeft: 4,
  },
  userActions: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.border2,
    marginBottom: 12,
  },
  actionSectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text3,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 14,
  },
  planChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  planChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  actionButtonsRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  selfNote: {
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'center' as const,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text3,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 16,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.red,
  },
  accessDeniedText: {
    fontSize: 14,
    color: Colors.text2,
  },
});
