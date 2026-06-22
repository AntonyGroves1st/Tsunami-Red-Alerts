import SwiftUI

struct SecurityView: View {
    let vm: AppViewModel
    @State private var activeSection: String = "overview"
    @State private var showPinSetup: Bool = false
    @State private var pinStep: Int = 1
    @State private var newPin: String = ""
    @State private var confirmPin: String = ""
    @State private var selectedTimeout: Int = 30

    var body: some View {
        VStack(spacing: 0) {
            tabBar
            ScrollView {
                VStack(spacing: 0) {
                    if activeSection == "overview" {
                        overviewContent
                    } else if activeSection == "pin" {
                        settingsContent
                    } else {
                        auditContent
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 40)
            }
        }
        .background(AppTheme.bg0)
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            tabButton(title: "Overview", key: "overview")
            tabButton(title: "Settings", key: "pin")
            tabButton(title: "Audit Log", key: "audit")
        }
        .background(AppTheme.bg1)
        .overlay(alignment: .bottom) {
            Rectangle().fill(AppTheme.border).frame(height: 1)
        }
    }

    private func tabButton(title: String, key: String) -> some View {
        Button {
            activeSection = key
        } label: {
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(activeSection == key ? AppTheme.amber : AppTheme.text2)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .overlay(alignment: .bottom) {
                    if activeSection == key {
                        Rectangle().fill(AppTheme.amber).frame(height: 2)
                    }
                }
        }
    }

    private var overviewContent: some View {
        VStack(spacing: 14) {
            scoreCard
            quickActions
            fraudSection
            hardeningSection
        }
        .padding(.top, 16)
    }

    private var scoreCard: some View {
        VStack(spacing: 16) {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(AppTheme.bg2).frame(width: 56, height: 56)
                    Image(systemName: vm.securityScore.score >= 70 ? "checkmark.shield.fill" : "exclamationmark.shield.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(scoreColor)
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("Security Score")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text2)
                    HStack(spacing: 10) {
                        Text("\(vm.securityScore.score)")
                            .font(.system(size: 36, weight: .heavy))
                            .foregroundStyle(scoreColor)
                        Text(vm.securityScore.grade)
                            .font(.system(size: 16, weight: .heavy))
                            .foregroundStyle(scoreColor)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 3)
                            .background(
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(scoreColor.opacity(0.15))
                                    .strokeBorder(scoreColor.opacity(0.4), lineWidth: 1)
                            )
                    }
                }
                Spacer()
                Button {
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 18))
                        .foregroundStyle(AppTheme.text2)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(AppTheme.bg3)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(scoreColor)
                        .frame(width: geo.size.width * Double(vm.securityScore.score) / 100)
                }
            }
            .frame(height: 6)

            if !vm.securityScore.issues.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(vm.securityScore.issues, id: \.self) { issue in
                        HStack(spacing: 8) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(AppTheme.amber)
                            Text(issue)
                                .font(.system(size: 12))
                                .foregroundStyle(AppTheme.text2)
                        }
                    }
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var scoreColor: Color {
        let s = vm.securityScore.score
        if s >= 85 { return AppTheme.green }
        if s >= 70 { return AppTheme.amber }
        if s >= 55 { return AppTheme.orange }
        return AppTheme.red
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            if vm.pinEnabled {
                quickActionButton(icon: "lock.fill", label: "Lock Now", color: AppTheme.red)
            }
            quickActionButton(icon: "doc.text", label: "Audit Log", color: AppTheme.blue) {
                activeSection = "audit"
            }
            quickActionButton(icon: "arrow.clockwise", label: "Rescan", color: AppTheme.green)
        }
    }

    private func quickActionButton(icon: String, label: String, color: Color, action: (() -> Void)? = nil) -> some View {
        Button {
            action?()
        } label: {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(AppTheme.text1)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
    }

    private var fraudSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Fraud Detection")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .padding(.top, 10)

            securitySettingCard(icon: "bell.fill", label: "Transaction Alerts", desc: "Alert on suspicious transactions", iconBg: AppTheme.green.opacity(0.1), iconColor: AppTheme.green, hasToggle: true, toggleValue: vm.transactionAlerts)
            securitySettingCard(icon: "waveform.path.ecg", label: "Anomaly Detection", desc: "AI-powered behavioral analysis", iconBg: AppTheme.cyan.opacity(0.1), iconColor: AppTheme.cyan, isActive: true)
            securitySettingCard(icon: "server.rack", label: "Device Binding", desc: "Verify device identity on each session", iconBg: AppTheme.orange.opacity(0.1), iconColor: AppTheme.orange, isActive: true)
            securitySettingCard(icon: "key.fill", label: "Secure Key Storage", desc: "API keys encrypted at rest", iconBg: AppTheme.amber.opacity(0.1), iconColor: AppTheme.amber, isActive: true)
        }
    }

    private var hardeningSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("App Hardening")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .padding(.top, 10)

            securitySettingCard(icon: "gauge.medium", label: "Rate Limiting", desc: "30 actions/min burst protection", iconBg: AppTheme.blue.opacity(0.1), iconColor: AppTheme.blue, isActive: true)
            securitySettingCard(icon: "barcode.viewfinder", label: "Input Sanitization", desc: "XSS & injection prevention", iconBg: AppTheme.purple.opacity(0.1), iconColor: AppTheme.purple, isActive: true)
            securitySettingCard(icon: "lock.shield.fill", label: "Encrypted Storage", desc: "SHA-256 hashed credentials & salts", iconBg: AppTheme.pink.opacity(0.1), iconColor: AppTheme.pink, isActive: true)
            securitySettingCard(icon: "network", label: "Session Integrity", desc: "Device-bound session tokens", iconBg: AppTheme.gold.opacity(0.1), iconColor: AppTheme.gold, isActive: true)
            securitySettingCard(icon: "nosign", label: "Account Lockout", desc: "5 failed attempts → 15 min lockout", iconBg: AppTheme.red.opacity(0.08), iconColor: AppTheme.red, isActive: true)
        }
    }

    private func securitySettingCard(icon: String, label: String, desc: String, iconBg: Color, iconColor: Color, hasToggle: Bool = false, toggleValue: Bool = false, isActive: Bool = false) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 12)
                .fill(iconBg)
                .frame(width: 40, height: 40)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(iconColor)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                Text(desc)
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            if hasToggle {
                Toggle("", isOn: .constant(toggleValue))
                    .labelsHidden()
                    .tint(AppTheme.amber)
            } else if isActive {
                Text("Active")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(AppTheme.green)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(AppTheme.green.opacity(0.1))
                            .strokeBorder(AppTheme.green.opacity(0.3), lineWidth: 1)
                    )
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var settingsContent: some View {
        VStack(spacing: 0) {
            authSection
            sessionSection
        }
        .padding(.top, 8)
    }

    private var authSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Authentication")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .padding(.top, 16)

            securitySettingCard(icon: "lock.fill", label: "PIN Lock", desc: vm.pinEnabled ? "6-digit PIN active" : "Protect app with a PIN", iconBg: AppTheme.amber.opacity(0.1), iconColor: AppTheme.amber)
            securitySettingCard(icon: "touchid", label: "Face ID", desc: "Use biometrics to unlock", iconBg: AppTheme.blue.opacity(0.1), iconColor: AppTheme.blue, hasToggle: true, toggleValue: vm.biometricEnabled)
        }
    }

    private var sessionSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Session & Privacy")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(.white)
                .tracking(0.5)
                .padding(.top, 24)

            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.purple.opacity(0.1))
                        .frame(width: 40, height: 40)
                        .overlay {
                            Image(systemName: "clock.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(AppTheme.purple)
                        }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Session Timeout")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                        Text("\(selectedTimeout) minutes of inactivity")
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.text2)
                    }
                    Spacer()
                }
                HStack(spacing: 8) {
                    ForEach([5, 15, 30, 60, 120], id: \.self) { t in
                        Button {
                            selectedTimeout = t
                        } label: {
                            Text(t < 60 ? "\(t)m" : "\(t / 60)h")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(selectedTimeout == t ? AppTheme.amber : AppTheme.text2)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(selectedTimeout == t ? AppTheme.amber.opacity(0.1) : AppTheme.bg2)
                                        .strokeBorder(selectedTimeout == t ? AppTheme.amber.opacity(0.4) : AppTheme.border, lineWidth: 1)
                                )
                        }
                    }
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )

            securitySettingCard(icon: "iphone", label: "Auto-Lock on Background", desc: "Lock when app goes to background", iconBg: AppTheme.pink.opacity(0.1), iconColor: AppTheme.pink, hasToggle: true, toggleValue: vm.autoLockOnBackground)
        }
    }

    private var auditContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Security Audit Log")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                Spacer()
                Button {} label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 16))
                        .foregroundStyle(AppTheme.text2)
                }
                Button {} label: {
                    Image(systemName: "trash")
                        .font(.system(size: 16))
                        .foregroundStyle(AppTheme.red)
                }
            }
            .padding(.top, 16)

            if vm.auditLog.isEmpty {
                VStack(spacing: 10) {
                    Image(systemName: "doc.text")
                        .font(.system(size: 40))
                        .foregroundStyle(AppTheme.text3)
                    Text("No security events recorded")
                        .font(.system(size: 13))
                        .foregroundStyle(AppTheme.text2)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ForEach(vm.auditLog) { event in
                    auditEventRow(event)
                }
            }
        }
    }

    private func auditEventRow(_ event: SecurityEvent) -> some View {
        HStack(alignment: .top, spacing: 12) {
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg2)
                .frame(width: 32, height: 32)
                .overlay {
                    Image(systemName: eventIcon(event.type))
                        .font(.system(size: 16))
                        .foregroundStyle(eventColor(event.type))
                }
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(event.message)
                        .font(.system(size: 13))
                        .foregroundStyle(AppTheme.text1)
                    Spacer()
                    Circle()
                        .fill(severityColor(event.severity))
                        .frame(width: 8, height: 8)
                }
                HStack(spacing: 10) {
                    Text(event.timestamp, style: .relative)
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                    Text(event.type.replacingOccurrences(of: "_", with: " "))
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text3)
                        .textCase(.lowercase)
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func eventIcon(_ type: String) -> String {
        switch type {
        case "login": return "checkmark.circle.fill"
        case "logout": return "xmark.circle.fill"
        case "failed_auth": return "exclamationmark.shield.fill"
        case "suspicious_activity": return "exclamationmark.triangle.fill"
        case "settings_change": return "key.fill"
        case "transaction": return "bolt.fill"
        case "lockout": return "nosign"
        case "integrity_check": return "shield.fill"
        default: return "waveform.path.ecg"
        }
    }

    private func eventColor(_ type: String) -> Color {
        switch type {
        case "login": return AppTheme.green
        case "failed_auth": return AppTheme.red
        case "suspicious_activity": return AppTheme.orange
        case "settings_change": return AppTheme.amber
        case "transaction": return AppTheme.blue
        case "lockout": return AppTheme.red
        case "integrity_check": return AppTheme.cyan
        default: return AppTheme.text2
        }
    }

    private func severityColor(_ severity: String) -> Color {
        switch severity {
        case "critical": return AppTheme.red
        case "high": return AppTheme.orange
        case "medium": return AppTheme.amber
        case "low": return AppTheme.green
        default: return AppTheme.text2
        }
    }
}
