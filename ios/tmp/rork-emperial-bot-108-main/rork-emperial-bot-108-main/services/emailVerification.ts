import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_STORE_KEY = 'emperial_email_verifications';
const VERIFIED_EMAILS_KEY = 'emperial_verified_emails';
const CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export interface VerificationEntry {
  email: string;
  code: string;
  createdAt: number;
  attempts: number;
  lastSentAt: number;
}

function generateCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

async function getStore(): Promise<Record<string, VerificationEntry>> {
  try {
    const raw = await AsyncStorage.getItem(VERIFICATION_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveStore(store: Record<string, VerificationEntry>): Promise<void> {
  await AsyncStorage.setItem(VERIFICATION_STORE_KEY, JSON.stringify(store));
}

async function getVerifiedEmails(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(VERIFIED_EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveVerifiedEmails(emails: string[]): Promise<void> {
  await AsyncStorage.setItem(VERIFIED_EMAILS_KEY, JSON.stringify(emails));
}

export async function sendVerificationCode(email: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  cooldownRemaining?: number;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  console.log('[EmailVerify] Sending verification code to:', normalizedEmail);

  const verified = await getVerifiedEmails();
  if (verified.includes(normalizedEmail)) {
    console.log('[EmailVerify] Email already verified');
    return { success: true, code: 'ALREADY_VERIFIED' };
  }

  const store = await getStore();
  const existing = store[normalizedEmail];

  if (existing) {
    const timeSinceLastSend = Date.now() - existing.lastSentAt;
    if (timeSinceLastSend < RESEND_COOLDOWN_MS) {
      const remaining = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSend) / 1000);
      console.log('[EmailVerify] Cooldown active, remaining:', remaining, 's');
      return {
        success: false,
        error: `Please wait ${remaining}s before requesting a new code`,
        cooldownRemaining: remaining,
      };
    }
  }

  const code = generateCode();
  const entry: VerificationEntry = {
    email: normalizedEmail,
    code,
    createdAt: Date.now(),
    attempts: 0,
    lastSentAt: Date.now(),
  };

  store[normalizedEmail] = entry;
  await saveStore(store);

  console.log('[EmailVerify] Verification code generated for:', normalizedEmail, '| Code:', code);

  return { success: true, code };
}

export async function verifyCode(email: string, inputCode: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const normalizedEmail = email.toLowerCase().trim();
  console.log('[EmailVerify] Verifying code for:', normalizedEmail);

  const verified = await getVerifiedEmails();
  if (verified.includes(normalizedEmail)) {
    return { success: true };
  }

  const store = await getStore();
  const entry = store[normalizedEmail];

  if (!entry) {
    return { success: false, error: 'No verification code found. Please request a new one.' };
  }

  if (Date.now() - entry.createdAt > CODE_EXPIRY_MS) {
    delete store[normalizedEmail];
    await saveStore(store);
    return { success: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (entry.attempts >= 5) {
    delete store[normalizedEmail];
    await saveStore(store);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  if (inputCode.trim() !== entry.code) {
    entry.attempts += 1;
    store[normalizedEmail] = entry;
    await saveStore(store);
    const remaining = 5 - entry.attempts;
    return { success: false, error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
  }

  delete store[normalizedEmail];
  await saveStore(store);

  verified.push(normalizedEmail);
  await saveVerifiedEmails(verified);

  console.log('[EmailVerify] Email verified successfully:', normalizedEmail);
  return { success: true };
}

export async function isEmailVerified(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const verified = await getVerifiedEmails();
  return verified.includes(normalizedEmail);
}

export async function removeVerification(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const store = await getStore();
  delete store[normalizedEmail];
  await saveStore(store);
}
