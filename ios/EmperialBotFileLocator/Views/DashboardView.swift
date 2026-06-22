import SwiftUI

struct DashboardView: View {
    let vm: AppViewModel
    @State private var timer: Timer?

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                headerSection
                priceCard
                apiStatusCard
                signalBadgesSection
                confluenceScoreCard
                oscillatorsSection
                quickStatsGrid
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
        .onAppear {
            timer = Timer.scheduledTimer(withTimeInterval: 3, repeats: true) { _ in
                vm.tickBot()
            }
        }
        .onDisappear { timer?.invalidate() }
    }

    private var headerSection: some View {
        HStack {
            HStack(spacing: 8) {
                RoundedRectangle(cornerRadius: 7)
                    .fill(AppTheme.amber)
                    .frame(width: 30, height: 30)
                    .overlay {
                        Text("E")
                            .font(.system(size: 16, weight: .black))
                            .foregroundStyle(AppTheme.bg0)
                    }
                VStack(alignment: .leading, spacing: 0) {
                    (Text("Emperial").foregroundStyle(.white) + Text("Bot").foregroundStyle(AppTheme.amber))
                        .font(.system(size: 20, weight: .heavy))
                }
                if vm.currentTier == .free {
                    Button {
                    } label: {
                        HStack(spacing: 3) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 8))
                            Text("Upgrade")
                                .font(.system(size: 9, weight: .heavy))
                        }
                        .foregroundStyle(AppTheme.bg0)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(AppTheme.amber, in: Capsule())
                    }
                }
            }
            Spacer()
            Button {
                vm.liveMode.toggle()
            } label: {
                HStack(spacing: 6) {
                    Circle()
                        .fill(vm.liveMode ? AppTheme.green : AppTheme.text2)
                        .frame(width: 7, height: 7)
                    Text(vm.liveMode ? "LIVE" : "STANDBY")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(vm.liveMode ? AppTheme.green : .white)
                        .tracking(0.8)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(vm.liveMode ? AppTheme.green.opacity(0.1) : Color.clear)
                        .strokeBorder(vm.liveMode ? AppTheme.green.opacity(0.25) : Color.clear, lineWidth: 1)
                )
            }
        }
        .padding(.top, 8)
    }

    private var priceCard: some View {
        VStack(spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(vm.selectedInstrument)
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundStyle(AppTheme.amber)
                        .tracking(1)
                    Text("Bitcoin · Binance")
                        .font(.system(size: 13))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
                Button {
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "clock")
                            .font(.system(size: 10))
                        Text(vm.selectedTimeframe)
                            .font(.system(size: 11, weight: .semibold))
                        Image(systemName: "chevron.down")
                            .font(.system(size: 10))
                    }
                    .foregroundStyle(AppTheme.text2)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(AppTheme.bg2)
                            .strokeBorder(AppTheme.border, lineWidth: 1)
                    )
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text("$43,250.00")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(AppTheme.amber)
                Text("+$850.00 (+2.01%)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(AppTheme.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 4))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            HStack {
                highLowItem(label: "24H HIGH", value: "$43,500", color: AppTheme.green, icon: "arrow.up.right")
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 16)
                highLowItem(label: "24H LOW", value: "$42,100", color: AppTheme.red, icon: "arrow.down.right")
            }
            .padding(10)
            .background(AppTheme.bg2, in: RoundedRectangle(cornerRadius: 8))
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func highLowItem(label: String, value: String, color: Color, icon: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
    }

    private var apiStatusCard: some View {
        VStack(spacing: 8) {
            HStack(spacing: 5) {
                Image(systemName: "timer")
                    .font(.system(size: 9))
                    .foregroundStyle(AppTheme.cyan)
                Text(Date(), style: .time)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white)
                    .monospacedDigit()
                Rectangle().fill(AppTheme.border2).frame(width: 1, height: 10)
                Text(Date(), style: .date)
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
                Spacer()
                Circle()
                    .fill(AppTheme.green)
                    .frame(width: 5, height: 5)
                Text("SYNCED")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.green)
                    .tracking(0.5)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.cyan.opacity(0.1), lineWidth: 1)
            )

            Rectangle().fill(AppTheme.border).frame(height: 1)

            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.system(size: 12))
                        .foregroundStyle(vm.liveMode ? AppTheme.green : AppTheme.text2)
                    Text("DATA SOURCE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.white)
                        .tracking(1)
                }
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.green)
                    Text("API Connected")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(AppTheme.green)
                }
            }

            Rectangle().fill(AppTheme.border).frame(height: 1)

            HStack(spacing: 6) {
                dataSourceButton(label: "Cached", sublabel: "Local data", icon: "wifi.slash", isActive: !vm.liveMode, color: AppTheme.amber) {
                    vm.liveMode = false
                }
                dataSourceButton(label: "Live (Binance)", sublabel: "Real-time market", icon: "wifi", isActive: vm.liveMode, color: AppTheme.green) {
                    vm.liveMode = true
                }
            }

            Rectangle().fill(AppTheme.border).frame(height: 1)

            VStack(alignment: .leading, spacing: 6) {
                Text("EXTERNAL SOURCES")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.8)
                HStack(spacing: 4) {
                    externalSourceChip(label: "TradingView", icon: "chart.bar.fill", color: Color(red: 0.16, green: 0.38, blue: 1.0))
                    externalSourceChip(label: "R Pro Trader", icon: "chart.line.uptrend.xyaxis", color: AppTheme.purple)
                    externalSourceChip(label: "NinjaTrader", icon: "target", color: AppTheme.amber)
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func dataSourceButton(label: String, sublabel: String, icon: String, isActive: Bool, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundStyle(isActive ? color : AppTheme.text2)
                VStack(alignment: .leading, spacing: 1) {
                    Text(label)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(isActive ? color : .white)
                    Text(sublabel)
                        .font(.system(size: 10))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isActive ? color.opacity(0.06) : AppTheme.bg2)
                    .strokeBorder(isActive ? color.opacity(0.4) : AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func externalSourceChip(label: String, icon: String, color: Color) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon)
                .font(.system(size: 12))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var signalBadgesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(AppTheme.amber)
                Text("SIGNAL BADGES")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .tracking(1)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(vm.signalBadges) { badge in
                        signalBadge(text: badge.text, type: badge.type)
                    }
                }
            }
            .contentMargins(.horizontal, 0)
        }
    }

    private func signalBadge(text: String, type: String) -> some View {
        let bgColor: Color = type == "long" ? AppTheme.green.opacity(0.12) : type == "short" ? AppTheme.red.opacity(0.12) : AppTheme.amber.opacity(0.15)
        let textColor: Color = type == "long" ? AppTheme.green : type == "short" ? AppTheme.red : AppTheme.amber
        let borderColor: Color = type == "long" ? AppTheme.green.opacity(0.3) : type == "short" ? AppTheme.red.opacity(0.3) : AppTheme.amber.opacity(0.4)

        return Text(text)
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(textColor)
            .tracking(0.3)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(bgColor)
                    .strokeBorder(borderColor, lineWidth: 1)
            )
    }

    private var confluenceScoreCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("CONFLUENCE SCORE")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(AppTheme.border)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(vm.compositeScore > 0 ? AppTheme.green : AppTheme.red)
                        .frame(width: geo.size.width * min(1, abs(vm.compositeScore) / 8))
                }
            }
            .frame(height: 6)

            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(String(format: "%@%.1f", vm.compositeScore > 0 ? "+" : "", vm.compositeScore))
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(vm.compositeScore > 2 ? AppTheme.green : vm.compositeScore < -2 ? AppTheme.red : AppTheme.text2)
                Text(vm.compositeDesc)
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text2)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var oscillatorsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("OSCILLATORS")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .tracking(1)

            VStack(spacing: 14) {
                oscillatorBar(label: "Market Pressure", value: vm.oscillatorData.mp, color: AppTheme.purple)
                oscillatorBar(label: "Refined (EMA)", value: vm.oscillatorData.rmp, color: AppTheme.pink)
                oscillatorBar(label: "Simple (SMA)", value: vm.oscillatorData.mps, color: AppTheme.cyan)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func oscillatorBar(label: String, value: Double, color: Color) -> some View {
        VStack(spacing: 6) {
            HStack {
                Circle().fill(color).frame(width: 6, height: 6)
                Text(label)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white)
                Spacer()
                Text(String(format: "%@%.4f", value >= 0 ? "+" : "", value))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(value >= 0 ? AppTheme.green : AppTheme.red)
            }
            GeometryReader { geo in
                let absVal = min(abs(value) * 100, 100)
                let isBull = value >= 0
                ZStack {
                    RoundedRectangle(cornerRadius: 2).fill(AppTheme.bg3)
                    Rectangle()
                        .fill(AppTheme.border2)
                        .frame(width: 1)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(isBull ? AppTheme.green : AppTheme.red)
                        .frame(width: geo.size.width * 0.5 * absVal / 100)
                        .offset(x: isBull ? geo.size.width * 0.25 : -(geo.size.width * 0.25))
                }
            }
            .frame(height: 4)
        }
    }

    private var quickStatsGrid: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("QUICK STATS")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white)
                .tracking(1)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                quickStatCard(label: "EMA 200", value: "42,180.50", isAbove: true)
                quickStatCard(label: "EMA 21", value: "43,050.20", isAbove: true)
                quickStatCard(label: "MACD", value: "+0.0024", isAbove: true)
                quickStatCard(label: "Cloud", value: "BULL", isAbove: true)
            }
        }
    }

    private func quickStatCard(label: String, value: String, isAbove: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.5)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text3)
            }
            Text(value)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(isAbove ? AppTheme.green : AppTheme.red)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }
}
