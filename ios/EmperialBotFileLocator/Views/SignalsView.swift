import SwiftUI

struct SignalsView: View {
    let vm: AppViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                activeSignalsSection
                allSourcesSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Signal")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("Hub")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.cyan)
                Text("Active Alerts & Triggers")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: "bell.fill")
                    .font(.system(size: 11))
                Text("\(vm.signals.count) active")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(AppTheme.amber)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.amber.opacity(0.1))
                    .strokeBorder(AppTheme.amber.opacity(0.2), lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private var activeSignalsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ACTIVE SIGNALS")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            if vm.signals.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .font(.system(size: 32))
                        .foregroundStyle(AppTheme.text3)
                    Text("No active signals")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.text2)
                    Text("Signals will appear when the bot detects trading opportunities")
                        .font(.caption)
                        .foregroundStyle(AppTheme.text3)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 30)
            } else {
                ForEach(vm.signals) { signal in
                    signalCard(signal)
                }
            }
        }
    }

    private func signalCard(_ signal: TradingSignal) -> some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Text(signal.direction == .long ? "LONG" : "SHORT")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        RoundedRectangle(cornerRadius: 6)
                            .fill(signal.direction == .long ? AppTheme.green : AppTheme.red)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(signal.instrument)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(AppTheme.text1)
                    Text(signal.source.label)
                        .font(.system(size: 10))
                        .foregroundStyle(AppTheme.text2)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("Confidence")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                    Text("\(signal.confidence)%")
                        .font(.system(size: 18, weight: .heavy))
                        .foregroundStyle(confidenceColor(signal.confidence))
                }
            }

            Divider().background(AppTheme.border)

            HStack {
                signalStat(label: "ENTRY", value: formatSmartPrice(signal.entryPrice))
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 24)
                Spacer()
                signalStat(label: "STOP LOSS", value: formatSmartPrice(signal.stopLoss), color: AppTheme.red)
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 24)
                Spacer()
                signalStat(label: "TAKE PROFIT", value: formatSmartPrice(signal.takeProfit), color: AppTheme.green)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func signalStat(label: String, value: String, color: Color = AppTheme.text1) -> some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(color)
        }
    }

    private func formatSmartPrice(_ value: Double) -> String {
        if value >= 1000 { return String(format: "$%.0f", value) }
        if value >= 1 { return String(format: "$%.2f", value) }
        return String(format: "$%.4f", value)
    }

    private func confidenceColor(_ value: Int) -> Color {
        if value >= 80 { return AppTheme.green }
        if value >= 60 { return AppTheme.amber }
        return AppTheme.red
    }

    private var allSourcesSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("SIGNAL SOURCES")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(SignalSource.allCases) { source in
                    HStack(spacing: 8) {
                        Image(systemName: sourceIcon(source))
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.cyan)
                        Text(source.label)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(AppTheme.text1)
                        Spacer()
                    }
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(AppTheme.bg1)
                            .strokeBorder(AppTheme.border, lineWidth: 1)
                    )
                }
            }
        }
    }

    private func sourceIcon(_ source: SignalSource) -> String {
        switch source {
        case .emaCross: return "arrow.triangle.swap"
        case .goldenCross: return "star.fill"
        case .deathCross: return "xmark.octagon"
        case .atrSignal: return "chart.xyaxis.line"
        case .rmpSignal: return "gauge.with.dots.needle.bottom.50percent"
        case .pressureFlip: return "arrow.up.arrow.down"
        case .cloudFlip: return "cloud.fill"
        case .composite: return "square.stack.3d.up"
        case .manual: return "hand.tap"
        }
    }
}
