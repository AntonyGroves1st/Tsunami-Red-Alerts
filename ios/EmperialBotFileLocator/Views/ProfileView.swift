import SwiftUI

struct ProfileView: View {
    let vm: AppViewModel
    @State private var showAdminPanel: Bool = false
    @State private var infoPage: InfoPageKind?

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                profileHeader
                if !vm.user.isMember {
                    upgradeSection
                } else {
                    memberSection
                }
                if vm.user.isAdmin {
                    adminSection
                }
                updatesSection
                accountSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 100)
        }
        .background(AppTheme.bg0)
        .sheet(isPresented: $showAdminPanel) {
            AdminPanelView(vm: vm)
        }
        .sheet(item: $infoPage) { kind in
            InfoPageView(kind: kind)
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 0) {
            ZStack {
                Circle()
                    .strokeBorder(AppTheme.amber.opacity(0.4), lineWidth: 2)
                    .frame(width: 88, height: 88)
                Circle()
                    .fill(AppTheme.bg3)
                    .strokeBorder(AppTheme.amber, lineWidth: 2)
                    .frame(width: 80, height: 80)
                    .overlay {
                        Text(vm.user.avatarInitials)
                            .font(.system(size: 28, weight: .heavy))
                            .foregroundStyle(AppTheme.amber)
                            .tracking(1)
                    }
            }
            .padding(.top, 28)
            .padding(.bottom, 16)

            Text(vm.user.displayName)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(.white)
            Text(vm.user.email)
                .font(.system(size: 14))
                .foregroundStyle(AppTheme.text2)
                .padding(.top, 4)

            HStack(spacing: 6) {
                Image(systemName: vm.user.isMember ? "crown.fill" : "lock.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(vm.user.isMember ? AppTheme.gold : AppTheme.text3)
                Text(vm.user.isMember ? "\(vm.user.plan.rawValue) Member" : "Free Account")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(vm.user.isMember ? AppTheme.gold : AppTheme.text3)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(vm.user.isMember ? AppTheme.gold.opacity(0.1) : Color.white.opacity(0.04))
                    .strokeBorder(vm.user.isMember ? AppTheme.gold.opacity(0.25) : AppTheme.border2, lineWidth: 1)
            )
            .padding(.top, 12)

            HStack(spacing: 0) {
                statColumn(value: vm.user.createdAt.formatted(.dateTime.month(.abbreviated).day().year()), label: "Joined")
                Rectangle().fill(AppTheme.border2).frame(width: 1, height: 24).padding(.horizontal, 8)
                statColumn(value: vm.user.isMember ? "Active" : "Locked", label: "Status", color: vm.user.isMember ? AppTheme.green : AppTheme.amber)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border2, lineWidth: 1)
            )
            .padding(.top, 20)
            .padding(.bottom, 24)
        }
    }

    private func statColumn(value: String, label: String, color: Color = .white) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(AppTheme.text3)
        }
        .frame(maxWidth: .infinity)
    }

    private var upgradeSection: some View {
        VStack(spacing: 14) {
            HStack(spacing: 14) {
                Image(systemName: "sparkles")
                    .font(.system(size: 20))
                    .foregroundStyle(AppTheme.amber)
                VStack(alignment: .leading, spacing: 4) {
                    Text("Unlock Full Access")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(AppTheme.amber)
                    Text("Upgrade your account to access charts, indicators, signals, bots, and more")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text2)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.amber.opacity(0.08))
                    .strokeBorder(AppTheme.amber.opacity(0.25), lineWidth: 1)
            )

            Text("Choose Your Plan")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 8)

            ForEach(vm.subscriptionPlans) { plan in
                planCard(plan: plan)
            }
        }
        .padding(.bottom, 24)
    }

    private func planCard(plan: SubscriptionPlan) -> some View {
        let color = planColor(plan.accentColor)
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(color.opacity(0.15))
                    .frame(width: 40, height: 40)
                    .overlay {
                        Image(systemName: planIcon(plan.tier))
                            .font(.system(size: 20))
                            .foregroundStyle(color)
                    }
                VStack(alignment: .leading, spacing: 2) {
                    Text(plan.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                    (Text(plan.price).font(.system(size: 17, weight: .heavy)).foregroundStyle(color) + Text(plan.interval).font(.system(size: 11, weight: .medium)).foregroundStyle(AppTheme.text2))
                }
                Spacer()
                HStack(spacing: 2) {
                    Text("Upgrade")
                        .font(.system(size: 12, weight: .bold))
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14))
                }
                .foregroundStyle(color)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    Capsule()
                        .fill(color.opacity(0.15))
                        .strokeBorder(color.opacity(0.4), lineWidth: 1)
                )
            }

            VStack(alignment: .leading, spacing: 6) {
                ForEach(plan.features, id: \.self) { feat in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12))
                            .foregroundStyle(color)
                            .padding(.top, 2)
                        Text(feat)
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.text1)
                    }
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
    }

    private var memberSection: some View {
        VStack(spacing: 12) {
            HStack(spacing: 14) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(AppTheme.gold)
                VStack(alignment: .leading, spacing: 4) {
                    Text("All Features Unlocked")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(AppTheme.gold)
                    Text("You have full access to every feature in Emperial Bot")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 18))
                    .foregroundStyle(AppTheme.gold)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.gold.opacity(0.06))
                    .strokeBorder(AppTheme.gold.opacity(0.2), lineWidth: 1)
            )

            menuRow(icon: "star.fill", label: "Manage Subscription", color: AppTheme.amber)
        }
        .padding(.bottom, 24)
    }

    private var adminSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Administration")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.bottom, 4)
                .padding(.top, 8)

            Button {
                showAdminPanel = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 18))
                        .foregroundStyle(AppTheme.red)
                    Text("Admin Control Panel")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(AppTheme.red)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 16))
                        .foregroundStyle(AppTheme.red)
                }
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.red.opacity(0.06))
                        .strokeBorder(AppTheme.red.opacity(0.25), lineWidth: 1)
                )
            }
        }
        .padding(.bottom, 20)
    }

    private var updatesSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Updates")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.bottom, 4)
                .padding(.top, 8)

            HStack(spacing: 12) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 18))
                    .foregroundStyle(AppTheme.green)
                Text("Auto-Update from Server")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                Spacer()
                Toggle("", isOn: .constant(true))
                    .labelsHidden()
                    .tint(AppTheme.green)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border2, lineWidth: 1)
            )
            .padding(.top, 8)

            menuRow(icon: "arrow.clockwise", label: "Check for Updates", color: AppTheme.cyan)

            HStack {
                Text("Current Version")
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text3)
                Spacer()
                Text("v1.0.0 (Build 1)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .padding(.bottom, 20)
    }

    private var accountSection: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Account")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(.white)
                .padding(.bottom, 4)
                .padding(.top, 8)

            menuRow(icon: "doc.text", label: "Terms of Service", color: AppTheme.text2) { infoPage = .terms }
            menuRow(icon: "shield", label: "Privacy Policy", color: AppTheme.text2) { infoPage = .privacy }
            menuRow(icon: "info.circle", label: "About", color: AppTheme.text2) { infoPage = .about }

            Button {
                vm.logout()
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 18))
                        .foregroundStyle(AppTheme.red)
                    Text("Log Out")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(AppTheme.red)
                    Spacer()
                }
                .padding(.vertical, 14)
                .padding(.horizontal, 16)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(AppTheme.red.opacity(0.04))
                        .strokeBorder(AppTheme.red.opacity(0.2), lineWidth: 1)
                )
            }
            .padding(.top, 16)
        }
    }

    private func menuRow(icon: String, label: String, color: Color, action: @escaping () -> Void = {}) -> some View {
        Button {
            action()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 16))
                    .foregroundStyle(AppTheme.text3)
            }
            .padding(.vertical, 14)
            .padding(.horizontal, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border2, lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private func planColor(_ name: String) -> Color {
        switch name {
        case "blue": return AppTheme.blue
        case "amber": return AppTheme.amber
        case "gold": return AppTheme.gold
        case "purple": return AppTheme.purple
        default: return AppTheme.cyan
        }
    }

    private func planIcon(_ tier: SubscriptionTier) -> String {
        switch tier {
        case .free: return "lock"
        case .starter: return "bolt.fill"
        case .pro: return "arrow.up.right"
        case .premium: return "crown.fill"
        case .elite: return "diamond.fill"
        }
    }
}
