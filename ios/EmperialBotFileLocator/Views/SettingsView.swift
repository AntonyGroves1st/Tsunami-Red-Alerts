import SwiftUI

struct SettingsView: View {
    @Bindable var vm: AppViewModel
    @State private var showEditProfile: Bool = false
    @State private var showResetConfirm: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                profileCard
                preferencesSection
                accountSection
                dangerZone
                appInfoSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
        .sheet(isPresented: $showEditProfile) {
            EditProfileSheet(vm: vm, isPresented: $showEditProfile)
        }
        .alert("Reset All Data?", isPresented: $showResetConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Reset", role: .destructive) {
                vm.trades = MockDataService.mockTrades()
                vm.signals = MockDataService.mockSignals()
                vm.alerts = MockDataService.mockAlerts()
                vm.portfolio = MockDataService.mockPortfolio()
                vm.botEnabled = false
                vm.arbitrageBotEnabled = false
                vm.currentTier = .free
            }
        } message: {
            Text("This will reset all trading data, alerts, and settings to defaults. This cannot be undone.")
        }
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Set")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("tings")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.cyan)
                Text("Profile & Preferences")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
        }
        .padding(.top, 8)
    }

    private var profileCard: some View {
        Button {
            showEditProfile = true
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: [AppTheme.cyan, AppTheme.purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 56, height: 56)
                    Text(String(vm.user.avatarInitials))
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(vm.user.displayName)
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                    Text(vm.user.email)
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text2)
                    HStack(spacing: 4) {
                        Image(systemName: "crown.fill")
                            .font(.system(size: 9))
                        Text(vm.currentTier.rawValue)
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundStyle(AppTheme.gold)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 13))
                    .foregroundStyle(AppTheme.text3)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var preferencesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PREFERENCES")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            VStack(spacing: 0) {
                settingsToggle(icon: "bell.fill", title: "Push Notifications", subtitle: "Alerts & signal updates", isOn: $vm.notificationsEnabled, color: AppTheme.amber)
                Divider().background(AppTheme.border).padding(.leading, 48)
                settingsToggle(icon: "hand.tap.fill", title: "Haptic Feedback", subtitle: "Vibrations on actions", isOn: $vm.hapticFeedbackEnabled, color: AppTheme.purple)
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func settingsToggle(icon: String, title: String, subtitle: String, isOn: Binding<Bool>, color: Color) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.12))
                .frame(width: 36, height: 36)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(color)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(AppTheme.text1)
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
            }

            Spacer()

            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(color)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ACCOUNT")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            VStack(spacing: 0) {
                settingsRow(icon: "creditcard.fill", title: "Subscription", subtitle: vm.currentTier.rawValue + " Plan", color: AppTheme.gold)
                Divider().background(AppTheme.border).padding(.leading, 48)
                settingsRow(icon: "link.circle.fill", title: "Connected Brokers", subtitle: "\(vm.connectedBrokersCount) active", color: AppTheme.cyan)
                Divider().background(AppTheme.border).padding(.leading, 48)
                settingsRow(icon: "key.fill", title: "API Keys", subtitle: "Manage stored keys", color: AppTheme.orange)
                Divider().background(AppTheme.border).padding(.leading, 48)
                settingsRow(icon: "square.and.arrow.up", title: "Export Data", subtitle: "Download trade history", color: AppTheme.green)
            }
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func settingsRow(icon: String, title: String, subtitle: String, color: Color) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.12))
                .frame(width: 36, height: 36)
                .overlay(
                    Image(systemName: icon)
                        .font(.system(size: 14))
                        .foregroundStyle(color)
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(AppTheme.text1)
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 11))
                .foregroundStyle(AppTheme.text3)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
    }

    private var dangerZone: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("DANGER ZONE")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.red.opacity(0.7))
                .tracking(1)

            Button {
                showResetConfirm = true
            } label: {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(AppTheme.red.opacity(0.12))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "arrow.counterclockwise")
                                .font(.system(size: 14))
                                .foregroundStyle(AppTheme.red)
                        )
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Reset All Data")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(AppTheme.red)
                        Text("Clear all trades, alerts, and settings")
                            .font(.system(size: 10))
                            .foregroundStyle(AppTheme.text2)
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.bg1)
                        .strokeBorder(AppTheme.red.opacity(0.15), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
    }

    private var appInfoSection: some View {
        VStack(spacing: 8) {
            Text("EmperialBot")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(AppTheme.text2)
            Text("Version 2.0.0 (Build 1)")
                .font(.system(size: 11))
                .foregroundStyle(AppTheme.text3)
            HStack(spacing: 4) {
                Image(systemName: "globe")
                    .font(.system(size: 10))
                Text("github.com/EmperialAI")
                    .font(.system(size: 10))
            }
            .foregroundStyle(AppTheme.cyan.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 8)
    }
}

struct EditProfileSheet: View {
    var vm: AppViewModel
    @Binding var isPresented: Bool
    @State private var editName: String = ""
    @State private var editEmail: String = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(colors: [AppTheme.cyan, AppTheme.purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .frame(width: 80, height: 80)
                    Text(String(editName.prefix(2)).uppercased())
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundStyle(.white)
                }
                .padding(.top, 20)

                VStack(alignment: .leading, spacing: 16) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text("USERNAME")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        HStack(spacing: 8) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(AppTheme.text2)
                            TextField("Username", text: $editName)
                                .foregroundStyle(AppTheme.text1)
                                .font(.system(size: 15))
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(AppTheme.bg2)
                                .strokeBorder(AppTheme.border, lineWidth: 1)
                        )
                    }

                    VStack(alignment: .leading, spacing: 5) {
                        Text("EMAIL")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        HStack(spacing: 8) {
                            Image(systemName: "envelope.fill")
                                .font(.system(size: 14))
                                .foregroundStyle(AppTheme.text2)
                            TextField("Email", text: $editEmail)
                                .foregroundStyle(AppTheme.text1)
                                .font(.system(size: 15))
                                .keyboardType(.emailAddress)
                                .autocorrectionDisabled()
                                .textInputAutocapitalization(.never)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(AppTheme.bg2)
                                .strokeBorder(AppTheme.border, lineWidth: 1)
                        )
                    }
                }
                .padding(.horizontal, 20)

                Spacer()

                Button {
                    // Save handled locally
                    _ = editName
                    _ = editEmail
                    isPresented = false
                } label: {
                    Text("Save Changes")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(AppTheme.cyan)
                        )
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(AppTheme.bg1)
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                        .foregroundStyle(AppTheme.text2)
                }
            }
        }
        .onAppear {
            editName = vm.user.displayName
            editEmail = vm.user.email
        }
        .presentationDetents([.large])
    }
}
