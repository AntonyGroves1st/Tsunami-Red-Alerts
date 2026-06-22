import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logSecurityEvent } from '@/services/securityService';

const OWNER_EMAIL = 'emperial646@gmail.com';
const OWNER_ORG = 'Emperial Solutions International, L.L.C.';
const PROTECTION_LOG_KEY = 'emperial_protection_log';
const BLOCKED_ENTITIES_KEY = 'emperial_blocked_entities';
const MAX_PROTECTION_LOGS = 500;

const BLOCKED_PERSONS = [
  { name: 'tony groves', region: 'UK', blocked: true, reason: 'Unauthorized access — permanently banned by owner directive' },
];

const BLOCKED_REGIONS = ['GB', 'UK'];

export interface ProtectionAlert {
  id: string;
  type: 'unauthorized_launch' | 'blocked_person' | 'blocked_region' | 'code_theft_attempt' | 'suspicious_clone';
  severity: 'high' | 'critical';
  message: string;
  detectedAt: number;
  metadata: Record<string, string>;
  notificationSent: boolean;
}

function generateAlertId(): string {
  return `prot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function checkBlockedPerson(email: string, displayName: string): Promise<{ blocked: boolean; reason?: string }> {
  const lowerEmail = email.toLowerCase().trim();
  const lowerName = displayName.toLowerCase().trim();

  for (const person of BLOCKED_PERSONS) {
    const nameMatch = lowerName.includes(person.name) || lowerEmail.includes(person.name.replace(/\s/g, ''));
    if (nameMatch) {
      console.log(`[Protection] BLOCKED PERSON DETECTED: ${person.name}`);

      await logProtectionAlert({
        type: 'blocked_person',
        severity: 'critical',
        message: `Blocked person "${person.name}" attempted to access the application. Email: ${lowerEmail}, Name: ${lowerName}`,
        metadata: {
          blockedName: person.name,
          attemptedEmail: lowerEmail,
          attemptedDisplayName: lowerName,
          region: person.region,
          reason: person.reason,
        },
      });

      await sendOwnerNotification({
        type: 'blocked_person',
        message: `ALERT: Blocked person "${person.name}" attempted to register/login with email "${lowerEmail}" and display name "${lowerName}".`,
        severity: 'critical',
      });

      return { blocked: true, reason: person.reason };
    }
  }

  try {
    const stored = await AsyncStorage.getItem(BLOCKED_ENTITIES_KEY);
    if (stored) {
      const customBlocked: Array<{ name: string; email: string }> = JSON.parse(stored);
      for (const entity of customBlocked) {
        if (
          (entity.email && lowerEmail === entity.email.toLowerCase()) ||
          (entity.name && lowerName.includes(entity.name.toLowerCase()))
        ) {
          console.log(`[Protection] Custom blocked entity detected: ${entity.name || entity.email}`);

          await sendOwnerNotification({
            type: 'blocked_person',
            message: `ALERT: Custom blocked entity "${entity.name || entity.email}" attempted access.`,
            severity: 'critical',
          });

          return { blocked: true, reason: 'This account has been permanently blocked by the application owner.' };
        }
      }
    }
  } catch {
    console.log('[Protection] Failed to check custom blocked entities');
  }

  return { blocked: false };
}

export async function checkRegionBlock(countryCode: string): Promise<{ blocked: boolean; reason?: string }> {
  const upper = countryCode.toUpperCase();
  if (BLOCKED_REGIONS.includes(upper)) {
    console.log(`[Protection] BLOCKED REGION: ${upper}`);

    await logProtectionAlert({
      type: 'blocked_region',
      severity: 'high',
      message: `Access attempt from blocked region: ${upper}`,
      metadata: { countryCode: upper },
    });

    await sendOwnerNotification({
      type: 'blocked_region',
      message: `ALERT: Access attempt detected from blocked region "${upper}". Access was denied.`,
      severity: 'high',
    });

    return {
      blocked: true,
      reason: `Access from ${upper} is permanently restricted. This application is the exclusive property of ${OWNER_ORG}.`,
    };
  }
  return { blocked: false };
}

export async function monitorUnauthorizedLaunch(userEmail: string | null): Promise<void> {
  try {
    const isOwner = userEmail?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const isAdmin = userEmail?.toLowerCase() === 'admin@emperialbot.com';

    if (!isOwner && !isAdmin && userEmail) {
      console.log(`[Protection] Non-owner launch detected: ${userEmail}`);

      await logProtectionAlert({
        type: 'unauthorized_launch',
        severity: 'high',
        message: `Application accessed by non-owner user: ${userEmail}`,
        metadata: {
          userEmail,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      });

      await sendOwnerNotification({
        type: 'unauthorized_launch',
        message: `NOTICE: User "${userEmail}" accessed EmperialBot on ${Platform.OS} at ${new Date().toISOString()}.`,
        severity: 'high',
      });
    }
  } catch (err) {
    console.log('[Protection] Monitor error:', err);
  }
}

async function logProtectionAlert(
  alert: Omit<ProtectionAlert, 'id' | 'detectedAt' | 'notificationSent'>
): Promise<ProtectionAlert> {
  const fullAlert: ProtectionAlert = {
    ...alert,
    id: generateAlertId(),
    detectedAt: Date.now(),
    notificationSent: false,
  };

  try {
    const stored = await AsyncStorage.getItem(PROTECTION_LOG_KEY);
    let logs: ProtectionAlert[] = stored ? JSON.parse(stored) : [];
    logs.unshift(fullAlert);
    if (logs.length > MAX_PROTECTION_LOGS) {
      logs = logs.slice(0, MAX_PROTECTION_LOGS);
    }
    await AsyncStorage.setItem(PROTECTION_LOG_KEY, JSON.stringify(logs));
  } catch {
    console.log('[Protection] Failed to persist alert');
  }

  await logSecurityEvent({
    type: 'suspicious_activity',
    severity: alert.severity === 'critical' ? 'critical' : 'high',
    message: `[OWNERSHIP PROTECTION] ${alert.message}`,
    metadata: alert.metadata,
  });

  console.log(`[Protection] [${alert.severity.toUpperCase()}] ${alert.message}`);
  return fullAlert;
}

async function sendOwnerNotification(params: {
  type: string;
  message: string;
  severity: string;
}): Promise<boolean> {
  try {
    const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    if (!baseUrl) {
      console.log('[Protection] No API base URL, notification queued locally');
      await queueNotification(params);
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/api/protection-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerEmail: OWNER_EMAIL,
        alertType: params.type,
        message: params.message,
        severity: params.severity,
        platform: Platform.OS,
        timestamp: new Date().toISOString(),
        appId: 'emperialbot',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      console.log('[Protection] Owner notification sent successfully');
      return true;
    } else {
      console.log('[Protection] Notification endpoint returned:', response.status);
      await queueNotification(params);
      return false;
    }
  } catch (err) {
    console.log('[Protection] Failed to send notification, queued locally:', err);
    await queueNotification(params);
    return false;
  }
}

async function queueNotification(params: { type: string; message: string; severity: string }): Promise<void> {
  try {
    const key = 'emperial_notification_queue';
    const stored = await AsyncStorage.getItem(key);
    const queue: Array<typeof params & { queuedAt: number }> = stored ? JSON.parse(stored) : [];
    queue.push({ ...params, queuedAt: Date.now() });
    if (queue.length > 100) queue.splice(0, queue.length - 100);
    await AsyncStorage.setItem(key, JSON.stringify(queue));
  } catch {
    console.log('[Protection] Failed to queue notification');
  }
}

export async function getProtectionLog(): Promise<ProtectionAlert[]> {
  try {
    const stored = await AsyncStorage.getItem(PROTECTION_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function addBlockedEntity(name: string, email: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(BLOCKED_ENTITIES_KEY);
    const list: Array<{ name: string; email: string; addedAt: number }> = stored ? JSON.parse(stored) : [];
    list.push({ name: name.toLowerCase(), email: email.toLowerCase(), addedAt: Date.now() });
    await AsyncStorage.setItem(BLOCKED_ENTITIES_KEY, JSON.stringify(list));
    console.log(`[Protection] Blocked entity added: ${name || email}`);
  } catch {
    console.log('[Protection] Failed to add blocked entity');
  }
}

export async function retryQueuedNotifications(): Promise<number> {
  try {
    const key = 'emperial_notification_queue';
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return 0;

    const queue: Array<{ type: string; message: string; severity: string; queuedAt: number }> = JSON.parse(stored);
    if (queue.length === 0) return 0;

    let sent = 0;
    const remaining: typeof queue = [];

    for (const item of queue) {
      const success = await sendOwnerNotification({
        type: item.type,
        message: item.message,
        severity: item.severity,
      });
      if (success) {
        sent++;
      } else {
        remaining.push(item);
        break;
      }
    }

    await AsyncStorage.setItem(key, JSON.stringify(remaining));
    console.log(`[Protection] Retried queued notifications: ${sent} sent, ${remaining.length} remaining`);
    return sent;
  } catch {
    return 0;
  }
}

export const OWNERSHIP_INFO = {
  owner: OWNER_ORG,
  ownerEmail: OWNER_EMAIL,
  blockedPersons: BLOCKED_PERSONS.map(p => p.name),
  blockedRegions: BLOCKED_REGIONS,
};
