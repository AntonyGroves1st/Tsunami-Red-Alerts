import SwiftUI

struct PaymentView: View {
    let vm: AppViewModel
    @State private var billingCycle: String = "annual"

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                heroSection
                billingToggle
                tiersSection
                lifetimeCard
                addOnsSection
                footerSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
    }

    private var heroSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(AppTheme.gold.opacity(0.1))
                    .strokeBorder(AppTheme.gold.opacity(0.2), lineWidth: 1)
                    .frame(width: 64, height: 64)
                Image(systemName: "crown.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(AppTheme.gold)
            }
            Text("Unlock Your Edge")
                .font(.system(size: 26, weight: .heavy))
                .foregroundStyle(.white)
                .tracking(-0.5)
            Text("From real-time signals to automated bots — choose the plan that fits your trading style.")
                .font(.system(size: 14))
                .foregroundStyle(AppTheme.text2)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .frame(maxWidth: 300)
        }
        .padding(.top, 28)
        .padding(.bottom, 8)
    }

    private var billingToggle: some View {
        HStack(spacing: 10) {
            billingPill(label: "Monthly", key: "monthly")
            billingPill(label: "Annual (Save 33%)", key: "annual")
        }
    }

    private func billingPill(label: String, key: String) -> some View {
        Button {
            billingCycle = key
        } label: {
            Text(label)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(billingCycle == key ? AppTheme.amber : AppTheme.text2)
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(
                    Capsule()
                        .fill(billingCycle == key ? AppTheme.amber.opacity(0.1) : Color.white.opacity(0.04))
                        .strokeBorder(billingCycle == key ? AppTheme.amber : AppTheme.border2, lineWidth: 1)
                )
        }
    }

    private var tiersSection: some View {
        VStack(spacing: 14) {
            ForEach(vm.subscriptionPlans) { plan in
                tierCard(plan: plan)
            }
        }
    }

    private func tierCard(plan: SubscriptionPlan) -> some View {
        let color = planColor(plan.accentColor)
        let isPopular = plan.tier == .pro
        let isCurrent = plan.tier == vm.currentTier

        return VStack(alignment: .leading, spacing: 14) {
            if isPopular {
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 10))
                    Text("POPULAR")
                        .font(.system(size: 9, weight: .heavy))
                        .tracking(1)
                }
                .foregroundStyle(AppTheme.bg0)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(color, in: RoundedRectangle(cornerRadius: 6))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.top, -6)
            }

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
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                    (Text(plan.price).font(.system(size: 18, weight: .heavy)).foregroundStyle(color) + Text(plan.interval).font(.system(size: 12, weight: .medium)).foregroundStyle(AppTheme.text2))
                }
                Spacer()
                if isCurrent {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 12))
                        Text("Current")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .foregroundStyle(AppTheme.green)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(AppTheme.green.opacity(0.1))
                            .strokeBorder(AppTheme.green.opacity(0.3), lineWidth: 1)
                    )
                } else {
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
                            .strokeBorder(color, lineWidth: 1)
                    )
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach(plan.features, id: \.self) { feat in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark")
                            .font(.system(size: 13))
                            .foregroundStyle(color)
                            .padding(.top, 2)
                        Text(feat)
                            .font(.system(size: 13))
                            .foregroundStyle(AppTheme.text1)
                    }
                }
            }

            if billingCycle == "annual" {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.system(size: 12))
                    Text("Save ~33% with annual billing")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(color)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
    }

    private var lifetimeCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 10) {
                Image(systemName: "shield.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(AppTheme.gold)
                Text("Lifetime Premium")
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(AppTheme.gold)
            }
            Text("One-time payment for all features, forever.")
                .font(.system(size: 13))
                .foregroundStyle(AppTheme.text2)
                .padding(.bottom, 6)
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("$5,000")
                    .font(.system(size: 28, weight: .heavy))
                    .foregroundStyle(AppTheme.gold)
                Text("one-time")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.gold.opacity(0.25), lineWidth: 1)
        )
    }

    private var addOnsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Add-Ons")
                .font(.system(size: 18, weight: .bold))
                .foregroundStyle(.white)
            Text("À la carte boosts for free & starter users")
                .font(.system(size: 13))
                .foregroundStyle(AppTheme.text2)

            addOnRow(icon: "clock.fill", label: "1s Chart Unlock", desc: "Permanent access to 1s windows for 10 pairs", price: "$29.99", color: AppTheme.cyan)
            addOnRow(icon: "antenna.radiowaves.left.and.right", label: "Arbitrage Scan Boost", desc: "50 extra scans/month (Gold/ETH cross-ex)", price: "$14.99", color: AppTheme.green)
            addOnRow(icon: "cpu", label: "Bot Starter Kit", desc: "Unlock basic Trading Bot for 1 month", price: "$49.99", color: AppTheme.purple)
        }
        .padding(.top, 12)
    }

    private func addOnRow(icon: String, label: String, desc: String, price: String, color: Color) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.white.opacity(0.04))
                .frame(width: 36, height: 36)
                .overlay {
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundStyle(color)
                }
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.white)
                Text(desc)
                    .font(.system(size: 11))
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            Text(price)
                .font(.system(size: 15, weight: .heavy))
                .foregroundStyle(AppTheme.amber)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
    }

    private var footerSection: some View {
        VStack(spacing: 12) {
            Button {
            } label: {
                Text("Restore Purchases")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
                    .underline()
            }
            Text("Payment will be charged to your account. Subscriptions auto-renew unless cancelled at least 24h before the end of the current period.")
                .font(.system(size: 10))
                .foregroundStyle(AppTheme.text3)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 320)
        }
        .padding(.top, 20)
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
