import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  Download,
  RefreshCw,
  X,
  Sparkles,
  AlertTriangle,
  Wrench,
  Check,
  ArrowUpCircle,
} from 'lucide-react-native';
import { Haptics } from '@/utils/haptics';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export default function UpdateModal() {
  const insets = useSafeAreaInsets();
  const {
    showUpdateModal,
    showMaintenanceModal,
    updateInfo,
    mustUpdate,
    dismissUpdate,
    openDownloadUrl,
    closeUpdateModal,
    closeMaintenanceModal,
    appVersion,
    isChecking,
  } = useAppUpdate();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const isVisible = showUpdateModal || showMaintenanceModal;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isVisible, slideAnim, overlayAnim]);

  if (!isVisible) return null;

  if (showMaintenanceModal) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Animated.View
            style={[
              styles.modal,
              {
                paddingBottom: insets.bottom + 20,
                transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
              },
            ]}
          >
            <View style={styles.handleBar} />
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.orange + '18' }]}>
                <Wrench size={32} color={Colors.orange} />
              </View>
            </View>
            <Text style={styles.title}>Under Maintenance</Text>
            <Text style={styles.subtitle}>
              {updateInfo?.maintenanceMessage || 'We are performing scheduled maintenance. Please try again later.'}
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                closeMaintenanceModal();
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.secondaryButtonText}>Dismiss</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Animated.View
          style={[
            styles.modal,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
            },
          ]}
        >
          <View style={styles.handleBar} />

          {!mustUpdate && (
            <Pressable
              onPress={() => {
                Haptics.impact('light');
                closeUpdateModal();
              }}
              style={styles.closeButton}
              testID="update-modal-close"
            >
              <X size={20} color={Colors.text3} />
            </Pressable>
          )}

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: mustUpdate ? Colors.red + '18' : Colors.green + '18' }]}>
              {mustUpdate ? (
                <AlertTriangle size={32} color={Colors.red} />
              ) : (
                <ArrowUpCircle size={32} color={Colors.green} />
              )}
            </View>
          </View>

          <Text style={styles.title}>
            {mustUpdate ? 'Update Required' : 'New Update Available'}
          </Text>

          <Text style={styles.subtitle}>
            {mustUpdate
              ? 'A critical update is required to continue using Emperial Bot. Please update now.'
              : `Version ${updateInfo?.latestVersion ?? ''} is available. You are running v${appVersion}.`}
          </Text>

          {updateInfo?.changelog && updateInfo.changelog.length > 0 && (
            <View style={styles.changelogContainer}>
              <Text style={styles.changelogTitle}>What's New</Text>
              <ScrollView
                style={styles.changelogScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {updateInfo.changelog.map((item, i) => (
                  <View key={i} style={styles.changelogItem}>
                    <Check size={12} color={Colors.green} style={{ marginTop: 3 }} />
                    <Text style={styles.changelogText}>{item}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {updateInfo?.releaseDate && (
            <Text style={styles.releaseDate}>
              Released {new Date(updateInfo.releaseDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            {updateInfo?.downloadUrl ? (
              <Pressable
                onPress={() => {
                  Haptics.notification('success');
                  openDownloadUrl();
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  mustUpdate && { backgroundColor: Colors.red },
                  pressed && { opacity: 0.85 },
                ]}
                testID="update-download-btn"
              >
                <Download size={18} color={Colors.bg0} />
                <Text style={styles.primaryButtonText}>
                  {mustUpdate ? 'Update Now' : 'Download Update'}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.noUrlBanner}>
                <Sparkles size={16} color={Colors.amber} />
                <Text style={styles.noUrlText}>
                  {mustUpdate
                    ? 'Please update from the App Store or Google Play.'
                    : 'Update will be applied automatically on next restart.'}
                </Text>
              </View>
            )}

            {!mustUpdate && (
              <Pressable
                onPress={() => {
                  Haptics.impact('light');
                  dismissUpdate();
                }}
                style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }]}
                testID="update-dismiss-btn"
              >
                <Text style={styles.secondaryButtonText}>Remind Me Later</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.bg1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.text3,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  changelogContainer: {
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    maxHeight: 180,
  },
  changelogTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  changelogScroll: {
    maxHeight: 140,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  changelogText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    flex: 1,
  },
  releaseDate: {
    fontSize: 11,
    color: Colors.text3,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.green,
    borderRadius: 14,
    height: 52,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.bg0,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  noUrlBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.amberDim,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 12,
    padding: 14,
  },
  noUrlText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    flex: 1,
  },
});
