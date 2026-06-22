import SwiftUI

struct BotsView: View {
    @Bindable var vm: AppViewModel
    @State private var showTradingBot: Bool = false
    @State private var showArbitrageBot: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    headerSection
                    tradingBotCard
                    arbitrageBotCard
                    performanceOverview
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 32)
            }
            .background(AppTheme.bg0)
            .navigationDestination(isPresented: $showTradingBot) {
                TradingBotDetailView(vm: vm)
            }
            .navigationDestination(isPresented: $showArbitrageBot) {
                ArbitrageBotDetailView(vm: vm)
            }
        }
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                (Text("Bot").foregroundStyle(.white) + Text("Engine").foregroundStyle(AppTheme.cyan))
                    .font(.system(size: 20, weight: .heavy))
                Text("AI-powered trading automation")
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            HStack(spacing: 6) {
                Circle()
                    .fill(vm.botEnabled ? AppTheme.green : AppTheme.text3)
                    .frame(width: 7, height: 7)
                Text(vm.botEnabled ? "ONLINE" : "OFFLINE")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(vm.botEnabled ? AppTheme.green : AppTheme.text3)
                    .tracking(0.8)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill((vm.botEnabled ? AppTheme.green : AppTheme.text3).opacity(0.1))
                    .strokeBorder((vm.botEnabled ? AppTheme.green : AppTheme.text3).opacity(0.25), lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private var tradingBotCard: some View {
        Button {
            showTradingBot = true
        } label: {
            VStack(spacing: 14) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.cyan.opacity(0.15))
                            .strokeBorder(AppTheme.cyan.opacity(0.4), lineWidth: 1)
                            .frame(width: 48, height: 48)
                        Image(systemName: "brain")
                            .font(.system(size: 22))
                            .foregroundStyle(AppTheme.cyan)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 8) {
                            Text("AMEE Engine")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(.white)
                            if vm.botEnabled {
                                Text("ACTIVE")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundStyle(AppTheme.green)
                                    .tracking(0.5)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(AppTheme.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                            }
                        }
                        Text("AI Micro-Execution Trading Bot")
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.text2)
                    }
                    Spacer()
                    Toggle("", isOn: $vm.botEnabled)
                        .labelsHidden()
                        .tint(AppTheme.cyan)
                }

                HStack(spacing: 0) {
                    botStatItem(label: "P&L", value: vm.formatPnl(vm.performance.totalPnl), color: vm.performance.totalPnl >= 0 ? AppTheme.green : AppTheme.red)
                    Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                    botStatItem(label: "WIN RATE", value: String(format: "%.0f%%", vm.performance.winRate), color: AppTheme.amber)
                    Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                    botStatItem(label: "TRADES", value: "\(vm.performance.totalTrades)", color: AppTheme.text1)
                    Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                    botStatItem(label: "OPEN", value: "\(vm.performance.openTrades)", color: AppTheme.cyan)
                }

                HStack {
                    Text("Tap to view dashboard")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text3)
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg1)
                    .strokeBorder(vm.botEnabled ? AppTheme.cyan.opacity(0.3) : AppTheme.border, lineWidth: 1)
            )
        }
    }

    private var arbitrageBotCard: some View {
        Button {
            showArbitrageBot = true
        } label: {
            VStack(spacing: 14) {
                HStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(AppTheme.amber.opacity(0.15))
                            .strokeBorder(AppTheme.amber.opacity(0.4), lineWidth: 1)
                            .frame(width: 48, height: 48)
                        Image(systemName: "arrow.left.arrow.right")
                            .font(.system(size: 20))
                            .foregroundStyle(AppTheme.amber)
                    }
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 8) {
                            Text("Arbitrage Scanner")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(.white)
                            if vm.arbitrageBotEnabled {
                                Text("SCANNING")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundStyle(AppTheme.amber)
                                    .tracking(0.5)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(AppTheme.amber.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                            }
                        }
                        Text("Cross-exchange price difference finder")
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.text2)
                    }
                    Spacer()
                    Toggle("", isOn: $vm.arbitrageBotEnabled)
                        .labelsHidden()
                        .tint(AppTheme.amber)
                }

                HStack {
                    Text("Tap to view scanner")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text3)
                }
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg1)
                    .strokeBorder(vm.arbitrageBotEnabled ? AppTheme.amber.opacity(0.3) : AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func botStatItem(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }

    private var performanceOverview: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("PERFORMANCE OVERVIEW")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                perfCard(label: "Avg Win", value: vm.formatPnl(vm.performance.avgWin), color: AppTheme.green, icon: "arrow.up.right")
                perfCard(label: "Avg Loss", value: String(format: "$%.2f", vm.performance.avgLoss), color: AppTheme.red, icon: "arrow.down.right")
                perfCard(label: "Profit Factor", value: String(format: "%.2f", vm.performance.profitFactor), color: AppTheme.cyan, icon: "chart.bar.fill")
                perfCard(label: "Max Drawdown", value: String(format: "$%.2f", vm.performance.maxDrawdown), color: AppTheme.amber, icon: "arrow.down.to.line")
            }
        }
    }

    private func perfCard(label: String, value: String, color: Color, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 10))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
            }
            Text(value)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(AppTheme.text1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }
}
