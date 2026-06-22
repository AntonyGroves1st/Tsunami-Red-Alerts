import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

type ImpactStyle = 'light' | 'medium' | 'heavy';

const IMPACT_MAP: Record<ImpactStyle, ExpoHaptics.ImpactFeedbackStyle> = {
  light: ExpoHaptics.ImpactFeedbackStyle.Light,
  medium: ExpoHaptics.ImpactFeedbackStyle.Medium,
  heavy: ExpoHaptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION_MAP: Record<string, ExpoHaptics.NotificationFeedbackType> = {
  success: ExpoHaptics.NotificationFeedbackType.Success,
  warning: ExpoHaptics.NotificationFeedbackType.Warning,
  error: ExpoHaptics.NotificationFeedbackType.Error,
};

export const Haptics = {
  impact: (style: ImpactStyle = 'light') => {
    if (Platform.OS === 'web') return;
    try {
      ExpoHaptics.impactAsync(IMPACT_MAP[style]);
    } catch (e) {
      console.log('[Haptics] impact failed:', e);
    }
  },

  notification: (type: 'success' | 'warning' | 'error' = 'success') => {
    if (Platform.OS === 'web') return;
    try {
      ExpoHaptics.notificationAsync(NOTIFICATION_MAP[type]);
    } catch (e) {
      console.log('[Haptics] notification failed:', e);
    }
  },

  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      ExpoHaptics.selectionAsync();
    } catch (e) {
      console.log('[Haptics] selection failed:', e);
    }
  },
};
