import SwiftUI

struct TradingBotDetailView: View {
    @Bindable var vm: AppViewModel
    @State private var activeTab: String = "dashboard"
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            header
            tabBar
            ScrollView {
                VStack(spacing: 12) {
                    if activeTab == "dashboard" {
                        dashboardContent
                    } else if activeTab == "trades" {
                        tradesContent
                    } else {
                        engineContent
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 40)
            }
        }
        .background(AppTheme.bg0)
        .navigationBarBackButtonHidden()
    }

    private var header: some View {
        HStack(spacing: 10) {
            Button { dismiss() } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 20))
                    .foregroundStyle(AppTheme.text1)
                    .frame(width: 36, height: 36)
                    .background(RoundedRectangle(cornerRadius: 10).fill(AppTheme.bg1).strokeBorder(AppTheme.border, lineWidth: 1))
            }
            HStack(spacing: 10) {
                (Text("AMEE").foregroundStyle(.white) + Text("Engine").foregroundStyle(AppTheme.cyan))
                    .font(.system(size: 18, weight: .heavy))
                    .tracking(-0.3)
                HStack(spacing: 5) {
                    Circle()
                        .fill(vm.botEnabled ? AppTheme.cyan : AppTheme.text3)
                        .frame(width: 6, height: 6)
                    Text(vm.botEnabled ? "ACTIVE" : "OFFLINE")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(vm.botEnabled ? AppTheme.cyan : AppTheme.text3)
                        .tracking(0.5)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill((vm.botEnabled ? AppTheme.cyan : AppTheme.text3).opacity(0.12))
                        .strokeBorder((vm.botEnabled ? AppTheme.cyan : AppTheme.text3).opacity(0.3), lineWidth: 1)
                )
            }
            Spacer()
            Button {
                vm.botEnabled.toggle()
            } label: {
                Image(systemName: "power")
                    .font(.system(size: 18))
                    .foregroundStyle(vm.botEnabled ? AppTheme.cyan : AppTheme.text2)
                    .frame(width: 36, height: 36)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(vm.botEnabled ? AppTheme.cyan.opacity(0.08) : AppTheme.bg1)
                            .strokeBorder(vm.botEnabled ? AppTheme.cyan.opacity(0.4) : AppTheme.border, lineWidth: 1)
                    )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private var tabBar: some View {
        HStack(spacing: 6) {
            botTabButton(label: "Dashboard", icon: "chart.bar.fill", key: "dashboard")
            botTabButton(label: "Trades", icon: "waveform.path.ecg", key: "trades")
            botTabButton(label: "AI Engine", icon: "brain", key: "engine")
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    private func botTabButton(label: String, icon: String, key: String) -> some View {
        Button {
            activeTab = key
        } label: {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
            }
            .foregroundStyle(activeTab == key ? AppTheme.cyan : AppTheme.text2)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(activeTab == key ? AppTheme.cyan.opacity(0.1) : AppTheme.bg1)
                    .strokeBorder(activeTab == key ? AppTheme.cyan.opacity(0.3) : AppTheme.border, lineWidth: 1)
            )
        }
    }

    private var dashboardContent: some View {
        VStack(spacing: 12) {
            coreCard
            metricsGrid
            performanceCard
            if !vm.openTrades.isEmpty {
                openPositionsSection
            }
        }
    }

    private var coreCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .strokeBorder(AppTheme.cyan.opacity(0.3), lineWidth: 2)
                        .frame(width: 56, height: 56)
                    Circle()
                        .fill(AppTheme.cyan.opacity(0.15))
                        .strokeBorder(AppTheme.cyan.opacity(0.4), lineWidth: 1)
                        .frame(width: 31, height: 31)
                        .overlay {
                            Image(systemName: "brain")
                                .font(.system(size: 16))
                                .foregroundStyle(vm.botEnabled ? AppTheme.cyan : AppTheme.text3)
                        }
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Micro-Execution Engine")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                    Text(vm.botEnabled ? "Demo mode · Auto-trade \(vm.autoTradeOn ? "ON" : "OFF")" : "Engine offline")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                    if vm.botEnabled {
                        HStack(spacing: 10) {
                            HStack(spacing: 3) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.system(size: 9))
                                Text("\(vm.scanCount) ticks")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundStyle(AppTheme.cyan)
                            HStack(spacing: 3) {
                                Image(systemName: "timer")
                                    .font(.system(size: 9))
                                Text("\(vm.execSpeed)ms")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundStyle(AppTheme.amber)
                            HStack(spacing: 3) {
                                Image(systemName: "eye")
                                    .font(.system(size: 9))
                                Text("\(vm.openTrades.count) open")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundStyle(AppTheme.green)
                        }
                        .padding(.top, 4)
                    }
                }
            }
            Divider().background(AppTheme.border)
            HStack {
                Text("Auto-Trade")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
                Spacer()
                Toggle("", isOn: $vm.autoTradeOn)
                    .labelsHidden()
                    .tint(AppTheme.cyan)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
            metricCard(label: "Total P&L", value: vm.formatPnl(vm.performance.totalPnl), color: vm.performance.totalPnl >= 0 ? AppTheme.green : AppTheme.red, icon: "dollarsign")
            metricCard(label: "Win Rate", value: String(format: "%.1f%%", vm.performance.winRate), color: AppTheme.amber, icon: "target")
            metricCard(label: "Profit Factor", value: vm.performance.profitFactor == .infinity ? "∞" : String(format: "%.2f", vm.performance.profitFactor), color: AppTheme.cyan, icon: "chart.bar.fill")
            metricCard(label: "Sharpe Ratio", value: String(format: "%.2f", vm.performance.sharpeRatio), color: AppTheme.purple, icon: "gauge.medium")
        }
    }

    private func metricCard(label: String, value: String, color: Color, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Image(systemName: icon)
                    .font(.system(size: 13))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
            }
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(color.opacity(0.2), lineWidth: 1)
        )
    }

    private var performanceCard: some View {
        VStack(spacing: 8) {
            HStack {
                Text("PERFORMANCE")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
                Spacer()
                Text("\(vm.performance.winCount)W / \(vm.performance.lossCount)L")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(vm.performance.winRate >= 50 ? AppTheme.green : AppTheme.red)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(AppTheme.bg3)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(vm.performance.winRate >= 60 ? AppTheme.green : vm.performance.winRate >= 40 ? AppTheme.amber : AppTheme.red)
                        .frame(width: geo.size.width * min(1, max(0.05, vm.performance.winRate / 100)))
                }
            }
            .frame(height: 6)
            HStack {
                Text(String(format: "%.1f%% win rate", vm.performance.winRate))
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
                Spacer()
                Text(String(format: "Max DD: $%.2f", vm.performance.maxDrawdown))
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var openPositionsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "circle.fill")
                    .font(.system(size: 6))
                    .foregroundStyle(AppTheme.green)
                Text("OPEN POSITIONS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
                Text("\(vm.openTrades.count)")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(AppTheme.cyan)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(AppTheme.cyan.opacity(0.2), in: RoundedRectangle(cornerRadius: 4))
            }
            ForEach(vm.openTrades) { trade in
                tradeRow(trade)
            }
        }
    }

    private var tradesContent: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                tradeSummaryPill(value: "\(vm.performance.winCount)", label: "Wins", color: AppTheme.green)
                tradeSummaryPill(value: "\(vm.performance.lossCount)", label: "Losses", color: AppTheme.red)
                tradeSummaryPill(value: "\(vm.openTrades.count)", label: "Open", color: AppTheme.cyan)
            }

            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 6) {
                    Image(systemName: "waveform.path.ecg")
                        .font(.system(size: 13))
                        .foregroundStyle(AppTheme.amber)
                    Text("TRADE HISTORY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                        .tracking(1)
                }

                if vm.trades.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: "cpu")
                            .font(.system(size: 36))
                            .foregroundStyle(AppTheme.text3)
                        Text("Scanning Markets...")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(AppTheme.text1)
                        Text("AI engine is analyzing conditions. Trades will appear when signals are detected.")
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.text2)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 40)
                } else {
                    ForEach(vm.trades.prefix(30)) { trade in
                        tradeRow(trade)
                    }
                }
            }
        }
    }

    private func tradeSummaryPill(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(color.opacity(0.06))
                .strokeBorder(color.opacity(0.2), lineWidth: 1)
        )
    }

    private func tradeRow(_ trade: BotTrade) -> some View {
        let isWin = trade.pnl > 0
        let borderColor: Color = trade.status == .stopped ? AppTheme.red : isWin ? AppTheme.green : trade.status == .open ? AppTheme.cyan : AppTheme.red

        return VStack(spacing: 8) {
            HStack {
                HStack(spacing: 6) {
                    Text(trade.instrument)
                        .font(.system(size: 11, weight: .heavy))
                        .foregroundStyle(AppTheme.amber)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(AppTheme.amber.opacity(0.12), in: RoundedRectangle(cornerRadius: 6))
                    HStack(spacing: 2) {
                        Image(systemName: trade.direction == .long ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 9))
                        Text(trade.direction.rawValue)
                            .font(.system(size: 9, weight: .bold))
                    }
                    .foregroundStyle(trade.direction == .long ? AppTheme.green : AppTheme.red)
                    .padding(.horizontal, 5)
                    .padding(.vertical, 2)
                    .background((trade.direction == .long ? AppTheme.green : AppTheme.red).opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                    if trade.status == .open {
                        HStack(spacing: 3) {
                            Circle().fill(AppTheme.green).frame(width: 5, height: 5)
                            Text("LIVE")
                                .font(.system(size: 7, weight: .heavy))
                                .tracking(0.5)
                        }
                        .foregroundStyle(AppTheme.green)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(AppTheme.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
                    }
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text(vm.formatPnl(trade.pnl))
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(isWin ? AppTheme.green : AppTheme.red)
                    Text(trade.source.label)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle((isWin ? AppTheme.green : AppTheme.red).opacity(0.8))
                }
            }
            Divider().background(AppTheme.border)
            HStack {
                Text("Entry \(vm.formatPrice(trade.entryPrice))")
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
                HStack(spacing: 3) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 8))
                    Text(trade.source.label)
                        .font(.system(size: 8, weight: .semibold))
                }
                .foregroundStyle(AppTheme.cyan)
                .padding(.horizontal, 5)
                .padding(.vertical, 2)
                .background(AppTheme.cyan.opacity(0.1), in: RoundedRectangle(cornerRadius: 4))
                Spacer()
                Text(trade.openTime, style: .time)
                    .font(.system(size: 9))
                    .foregroundStyle(AppTheme.text3)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
        .overlay(alignment: .leading) {
            RoundedRectangle(cornerRadius: 10)
                .fill(borderColor)
                .frame(width: 3)
        }
    }

    private var engineContent: some View {
        VStack(spacing: 12) {
            engineCard(title: "SIGNAL SOURCES", icon: "brain", iconColor: AppTheme.cyan) {
                VStack(spacing: 0) {
                    sourceRow(label: "EMA Cross", color: AppTheme.cyan)
                    sourceRow(label: "Golden Cross", color: AppTheme.green)
                    sourceRow(label: "ATR Signal", color: AppTheme.amber)
                    sourceRow(label: "RMP Signal", color: AppTheme.purple)
                    sourceRow(label: "Pressure Flip", color: AppTheme.orange)
                    sourceRow(label: "Composite", color: AppTheme.cyan)
                }
            }

            engineCard(title: "RISK MANAGEMENT", icon: "shield.fill", iconColor: AppTheme.green) {
                VStack(spacing: 0) {
                    riskRow(label: "Stop Loss", value: "2.0%", color: AppTheme.red)
                    riskRow(label: "Take Profit", value: "4.0%", color: AppTheme.green)
                    riskRow(label: "Max Position", value: "$5,000", color: AppTheme.cyan)
                    riskRow(label: "Max Concurrent", value: "3 trades", color: AppTheme.amber)
                    riskRow(label: "Min Confidence", value: "60%", color: AppTheme.purple)
                }
            }

            engineCard(title: "ENGINE STATS", icon: "gauge.medium", iconColor: AppTheme.amber) {
                VStack(spacing: 0) {
                    riskRow(label: "Total Scans", value: "\(vm.scanCount)", color: AppTheme.text1)
                    riskRow(label: "Avg Speed", value: "\(vm.execSpeed)ms", color: AppTheme.cyan)
                    riskRow(label: "Total Trades", value: "\(vm.performance.totalTrades)", color: AppTheme.amber)
                    riskRow(label: "Best Trade", value: String(format: "$%.2f", vm.performance.bestTrade), color: AppTheme.green)
                    riskRow(label: "Worst Trade", value: String(format: "$%.2f", vm.performance.worstTrade), color: AppTheme.red)
                }
            }
        }
    }

    private func engineCard(title: String, icon: String, iconColor: Color, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(iconColor)
                Text(title)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
            }
            content()
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func sourceRow(label: String, color: Color) -> some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.text1)
            Spacer()
            Text("ACTIVE")
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.green)
                .tracking(0.5)
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(AppTheme.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
        }
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) {
            Rectangle().fill(AppTheme.border).frame(height: 0.5)
        }
    }

    private func riskRow(label: String, value: String, color: Color) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.text2)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(color)
        }
        .padding(.vertical, 8)
        .overlay(alignment: .bottom) {
            Rectangle().fill(AppTheme.border).frame(height: 0.5)
        }
    }
}
