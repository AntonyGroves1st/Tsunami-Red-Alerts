import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  TextInput,
  Platform,
  FlatList,
} from 'react-native';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Fingerprint,
  Clock,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  KeyRound,
  Smartphone,
  Activity,
  FileText,
  RefreshCw,
  Zap,
  Server,
  Ban,
  ShieldOff,
  Gauge,
  ScanLine,
  DatabaseZap,
  Network,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useSecurity } from '@/hooks/useSecurity';
import type { SecurityEvent } from '@/services/securityService';
import { Haptics } from '@/utils/haptics';

type ActiveSection = 'overview' | 'pin' | 'audit';

export default function SecurityScreen() {
  const {
    settings,
    securityScore,
    auditLog,
    biometricAvailable,
    biometricType,
    lockoutInfo,
    setupPin,
    removePin,
    toggleBiometric,
    setSessionTimeout,
    setAutoLock,
    setTransactionAlerts,
    lockApp,
    refreshScore,
    refreshLog,
    clearAuditLog,
  } = useSecurity();

  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [pinSetupMode, setPinSetupMode] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinStep, setPinStep] = useState<1 | 2>(1);
  const [showPinInput, setShowPinInput] = useState<boolean>(false);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [selectedTimeout, setSelectedTimeout] = useState<number>(settings.sessionTimeoutMinutes);

  useEffect(() => {
    Animated.timing(scoreAnim, {
      toValue: securityScore.score / 100,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [securityScore.score]);

  useEffect(() => {
    setSelectedTimeout(settings.sessionTimeoutMinutes);
  }, [settings.sessionTimeoutMinutes]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 85) return Colors.green;
    if (score >= 70) return Colors.amber;
    if (score >= 55) return Colors.orange;
    return Colors.red;
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return Colors.red;
      case 'high': return Colors.orange;
      case 'medium': return Colors.amber;
      case 'low': return Colors.green;
      default: return Colors.text2;
    }
  }, []);

  const getSeverityIcon = useCallback((severity: string) => {
    switch (severity) {
      case 'critical': return <Ban size={14} color={Colors.red} />;
      case 'high': return <AlertTriangle size={14} color={Colors.orange} />;
      case 'medium': return <Info size={14} color={Colors.amber} />;
      case 'low': return <CheckCircle size={14} color={Colors.green} />;
      default: return <Info size={14} color={Colors.text2} />;
    }
  }, []);

  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case 'login': return <CheckCircle size={16} color={Colors.green} />;
      case 'logout': return <XCircle size={16} color={Colors.text2} />;
      case 'failed_auth': return <ShieldAlert size={16} color={Colors.red} />;
      case 'suspicious_activity': return <AlertTriangle size={16} color={Colors.orange} />;
      case 'settings_change': return <KeyRound size={16} color={Colors.amber} />;
      case 'transaction': return <Zap size={16} color={Colors.blue} />;
      case 'lockout': return <Ban size={16} color={Colors.red} />;
      case 'integrity_check': return <Shield size={16} color={Colors.cyan} />;
      default: return <Activity size={16} color={Colors.text2} />;
    }
  }, []);

  const handleSetupPin = useCallback(() => {
    setPinSetupMode(true);
    setPinStep(1);
    setNewPin('');
    setConfirmPin('');
    setShowPinInput(true);
  }, []);

  const handlePinSubmit = useCallback(async () => {
    if (pinStep === 1) {
      if (newPin.length !== 6) {
        Alert.alert('Invalid PIN', 'PIN must be exactly 6 digits');
        return;
      }
      setPinStep(2);
      return;
    }

    if (confirmPin !== newPin) {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      setPinStep(1);
      setNewPin('');
      setConfirmPin('');
      return;
    }

    const result = await setupPin(newPin);
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notification('success');
      }
      Alert.alert('PIN Set', 'Your security PIN has been configured.');
      setPinSetupMode(false);
      setShowPinInput(false);
      setNewPin('');
      setConfirmPin('');
    } else {
      Alert.alert('Weak PIN', result.reason ?? 'Failed to set PIN. Please try again.');
      setPinStep(1);
      setNewPin('');
      setConfirmPin('');
    }
  }, [pinStep, newPin, confirmPin, setupPin]);

  const handleRemovePin = useCallback(() => {
    Alert.alert(
      'Remove PIN',
      'This will disable PIN lock protection. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            if (Platform.OS !== 'web') {
              Haptics.notification('warning');
            }
          },
        },
      ]
    );
  }, [removePin]);

  const handleLockNow = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impact('heavy');
    }
    await lockApp();
  }, [lockApp]);

  const handleClearLog = useCallback(() => {
    Alert.alert(
      'Clear Audit Log',
      'This will permanently delete all security events. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearAuditLog },
      ]
    );
  }, [clearAuditLog]);

  const timeoutOptions = [5, 15, 30, 60, 120];

  const formatTime = useCallback((ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }, []);

  const scoreBarWidth = scoreAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const renderScoreCard = () => {
    const color = getScoreColor(securityScore.score);
    return (
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <View style={styles.scoreIconWrap}>
            {securityScore.score >= 70 ? (
              <ShieldCheck size={32} color={color} />
            ) : (
              <ShieldAlert size={32} color={color} />
            )}
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Security Score</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color }]}>{securityScore.score}</Text>
              <View style={[styles.gradeBadge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
                <Text style={[styles.gradeText, { color }]}>{securityScore.grade}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={refreshScore} style={styles.refreshBtn}>
            <RefreshCw size={18} color={Colors.text2} />
          </TouchableOpacity>
        </View>

        <View style={styles.scoreBarBg}>
          <Animated.View style={[styles.scoreBarFill, { width: scoreBarWidth, backgroundColor: color }]} />
        </View>

        {securityScore.issues.length > 0 && (
          <View style={styles.issuesList}>
            {securityScore.issues.map((issue, i) => (
              <View key={i} style={styles.issueRow}>
                <AlertTriangle size={12} color={Colors.amber} />
                <Text style={styles.issueText}>{issue}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      {settings.pinEnabled && (
        <TouchableOpacity style={styles.quickBtn} onPress={handleLockNow} testID="lock-now-btn">
          <Lock size={20} color={Colors.red} />
          <Text style={styles.quickBtnText}>Lock Now</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.quickBtn} onPress={() => setActiveSection('audit')} testID="view-log-btn">
        <FileText size={20} color={Colors.blue} />
        <Text style={styles.quickBtnText}>Audit Log</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickBtn} onPress={refreshScore} testID="rescan-btn">
        <RefreshCw size={20} color={Colors.green} />
        <Text style={styles.quickBtnText}>Rescan</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Authentication</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: Colors.amberDim }]}>
              <Lock size={18} color={Colors.amber} />
            </View>
            <View>
              <Text style={styles.settingLabel}>PIN Lock</Text>
              <Text style={styles.settingDesc}>
                {settings.pinEnabled ? '6-digit PIN active' : 'Protect app with a PIN'}
              </Text>
            </View>
          </View>
          {settings.pinEnabled ? (
            <TouchableOpacity onPress={handleRemovePin} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSetupPin} style={styles.enableBtn}>
              <Text style={styles.enableBtnText}>Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {showPinInput && pinSetupMode && (
          <View style={styles.pinSetupArea}>
            <Text style={styles.pinStepLabel}>
              {pinStep === 1 ? 'Enter new 6-digit PIN' : 'Confirm your PIN'}
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pinStep === 1 ? newPin : confirmPin}
              onChangeText={pinStep === 1 ? setNewPin : setConfirmPin}
              maxLength={6}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor={Colors.text3}
              testID="pin-input"
            />
            <View style={styles.pinBtns}>
              <TouchableOpacity
                style={styles.pinCancelBtn}
                onPress={() => {
                  setPinSetupMode(false);
                  setShowPinInput(false);
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pinConfirmBtn,
                  (pinStep === 1 ? newPin.length !== 6 : confirmPin.length !== 6) && styles.pinBtnDisabled,
                ]}
                onPress={handlePinSubmit}
                disabled={pinStep === 1 ? newPin.length !== 6 : confirmPin.length !== 6}
              >
                <Text style={styles.pinConfirmText}>
                  {pinStep === 1 ? 'Next' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {biometricAvailable && (
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: 'rgba(56,189,248,0.1)' }]}>
                <Fingerprint size={18} color={Colors.blue} />
              </View>
              <View>
                <Text style={styles.settingLabel}>{biometricType}</Text>
                <Text style={styles.settingDesc}>Use biometrics to unlock</Text>
              </View>
            </View>
            <Switch
              value={settings.biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ false: Colors.bg3, true: Colors.amber + '60' }}
              thumbColor={settings.biometricEnabled ? Colors.amber : Colors.text2}
              testID="biometric-switch"
            />
          </View>
        </View>
      )}
    </View>
  );

  const renderSessionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session & Privacy</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(167,139,250,0.1)' }]}>
              <Clock size={18} color={Colors.purple} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Session Timeout</Text>
              <Text style={styles.settingDesc}>{selectedTimeout} minutes of inactivity</Text>
            </View>
          </View>
        </View>
        <View style={styles.timeoutRow}>
          {timeoutOptions.map(t => (
            <TouchableOpacity
              key={t}
              style={[
                styles.timeoutBtn,
                selectedTimeout === t && styles.timeoutBtnActive,
              ]}
              onPress={() => {
                setSelectedTimeout(t);
                setSessionTimeout(t);
              }}
            >
              <Text
                style={[
                  styles.timeoutBtnText,
                  selectedTimeout === t && styles.timeoutBtnTextActive,
                ]}
              >
                {t < 60 ? `${t}m` : `${t / 60}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(244,114,182,0.1)' }]}>
              <Smartphone size={18} color={Colors.pink} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Auto-Lock on Background</Text>
              <Text style={styles.settingDesc}>Lock when app goes to background</Text>
            </View>
          </View>
          <Switch
            value={settings.autoLockOnBackground}
            onValueChange={setAutoLock}
            trackColor={{ false: Colors.bg3, true: Colors.amber + '60' }}
            thumbColor={settings.autoLockOnBackground ? Colors.amber : Colors.text2}
            testID="auto-lock-switch"
          />
        </View>
      </View>
    </View>
  );

  const renderFraudSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Fraud Detection</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Bell size={18} color={Colors.green} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Transaction Alerts</Text>
              <Text style={styles.settingDesc}>Alert on suspicious transactions</Text>
            </View>
          </View>
          <Switch
            value={settings.transactionAlerts}
            onValueChange={setTransactionAlerts}
            trackColor={{ false: Colors.bg3, true: Colors.amber + '60' }}
            thumbColor={settings.transactionAlerts ? Colors.amber : Colors.text2}
            testID="tx-alerts-switch"
          />
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(103,232,249,0.1)' }]}>
              <Activity size={18} color={Colors.cyan} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Anomaly Detection</Text>
              <Text style={styles.settingDesc}>AI-powered behavioral analysis</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(251,146,60,0.1)' }]}>
              <Server size={18} color={Colors.orange} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Device Binding</Text>
              <Text style={styles.settingDesc}>Verify device identity on each session</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
              <KeyRound size={18} color={Colors.amber} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Secure Key Storage</Text>
              <Text style={styles.settingDesc}>API keys encrypted at rest</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderHardeningSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>App Hardening</Text>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(56,189,248,0.1)' }]}>
              <Gauge size={18} color={Colors.blue} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Rate Limiting</Text>
              <Text style={styles.settingDesc}>30 actions/min burst protection</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(167,139,250,0.1)' }]}>
              <ScanLine size={18} color={Colors.purple} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Input Sanitization</Text>
              <Text style={styles.settingDesc}>XSS & injection prevention</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(244,114,182,0.1)' }]}>
              <DatabaseZap size={18} color={Colors.pink} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Encrypted Storage</Text>
              <Text style={styles.settingDesc}>SHA-256 hashed credentials & salts</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(253,230,138,0.1)' }]}>
              <Network size={18} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Session Integrity</Text>
              <Text style={styles.settingDesc}>Device-bound session tokens</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
              <Ban size={18} color={Colors.red} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Account Lockout</Text>
              <Text style={styles.settingDesc}>5 failed attempts → 15 min lockout</Text>
            </View>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAuditLog = () => {
    const renderEvent = ({ item }: { item: SecurityEvent }) => (
      <View style={styles.logItem}>
        <View style={styles.logIconWrap}>
          {getEventIcon(item.type)}
        </View>
        <View style={styles.logContent}>
          <View style={styles.logTopRow}>
            <Text style={styles.logMessage} numberOfLines={2}>{item.message}</Text>
            <View style={[styles.severityDot, { backgroundColor: getSeverityColor(item.severity) }]} />
          </View>
          <View style={styles.logMeta}>
            <Text style={styles.logTime}>{formatTime(item.timestamp)}</Text>
            <Text style={styles.logType}>{item.type.replace(/_/g, ' ')}</Text>
          </View>
        </View>
      </View>
    );

    return (
      <View style={styles.auditSection}>
        <View style={styles.auditHeader}>
          <Text style={styles.sectionTitle}>Security Audit Log</Text>
          <View style={styles.auditActions}>
            <TouchableOpacity onPress={() => refreshLog()} style={styles.auditActionBtn}>
              <RefreshCw size={16} color={Colors.text2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearLog} style={styles.auditActionBtn}>
              <Trash2 size={16} color={Colors.red} />
            </TouchableOpacity>
          </View>
        </View>

        {auditLog.length === 0 ? (
          <View style={styles.emptyLog}>
            <FileText size={40} color={Colors.text3} />
            <Text style={styles.emptyLogText}>No security events recorded</Text>
          </View>
        ) : (
          <FlatList
            data={auditLog}
            renderItem={renderEvent}
            keyExtractor={item => item.id}
            style={styles.logList}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {(['overview', 'pin', 'audit'] as ActiveSection[]).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeSection === tab && styles.tabActive]}
          onPress={() => setActiveSection(tab)}
        >
          <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
            {tab === 'overview' ? 'Overview' : tab === 'pin' ? 'Settings' : 'Audit Log'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderTabBar()}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'overview' && (
          <>
            {renderScoreCard()}
            {renderQuickActions()}
            {renderFraudSection()}
            {renderHardeningSection()}
          </>
        )}

        {activeSection === 'pin' && (
          <>
            {renderAuthSection()}
            {renderSessionSection()}
          </>
        )}

        {activeSection === 'audit' && renderAuditLog()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.amber,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  tabTextActive: {
    color: Colors.amber,
  },
  scoreCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.bg2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.text2,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800' as const,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  refreshBtn: {
    padding: 8,
  },
  scoreBarBg: {
    height: 6,
    backgroundColor: Colors.bg3,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  issuesList: {
    gap: 6,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  issueText: {
    fontSize: 12,
    color: Colors.text2,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
    lineHeight: 17,
  },
  removeBtn: {
    backgroundColor: Colors.redDim,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.red,
  },
  enableBtn: {
    backgroundColor: Colors.amberDim,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  enableBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.amber,
  },
  activeBadge: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.green,
  },
  pinSetupArea: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pinStepLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  pinInput: {
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    color: Colors.white,
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  pinBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
  },
  pinCancelText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  pinConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.amber,
    alignItems: 'center',
  },
  pinBtnDisabled: {
    opacity: 0.4,
  },
  pinConfirmText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.bg0,
  },
  timeoutRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timeoutBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeoutBtnActive: {
    backgroundColor: Colors.amberDim,
    borderColor: Colors.amber + '40',
  },
  timeoutBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text2,
  },
  timeoutBtnTextActive: {
    color: Colors.amber,
  },
  auditSection: {
    marginTop: 8,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  auditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  auditActionBtn: {
    padding: 6,
  },
  logList: {
    gap: 0,
  },
  logItem: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  logIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.bg2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  logMessage: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 19,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  logMeta: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  logTime: {
    fontSize: 11,
    color: Colors.text2,
  },
  logType: {
    fontSize: 11,
    color: Colors.text3,
    textTransform: 'capitalize' as const,
  },
  emptyLog: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyLogText: {
    fontSize: 13,
    color: Colors.text2,
  },
});
