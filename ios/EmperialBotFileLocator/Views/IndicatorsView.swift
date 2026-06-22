import SwiftUI

struct IndicatorInfo: Identifiable {
    let id: String
    let name: String
    let abbreviation: String
    let category: String
    let summary: String
    let value: Double
    let signal: String
    let color: Color
}

struct IndicatorsView: View {
    @Bindable var vm: AppViewModel
    @State private var selected: IndicatorInfo?

    private var indicators: [IndicatorInfo] {
        [
            IndicatorInfo(id: "mp", name: "Market Pressure", abbreviation: "MP", category: "Oscillator", summary: "Net buying vs selling pressure derived from order flow imbalance.", value: vm.oscillatorData.mp, signal: vm.oscillatorData.mp > 0 ? "Bullish" : "Bearish", color: vm.oscillatorData.mp > 0 ? AppTheme.green : AppTheme.red),
            IndicatorInfo(id: "rmp", name: "Relative Market Pressure", abbreviation: "RMP", category: "Oscillator", summary: "Normalized pressure relative to recent volatility range.", value: vm.oscillatorData.rmp, signal: vm.oscillatorData.rmp > 0 ? "Long Bias" : "Short Bias", color: vm.oscillatorData.rmp > 0 ? AppTheme.green : AppTheme.red),
            IndicatorInfo(id: "mps", name: "MP Smoothed", abbreviation: "MPS", category: "Oscillator", summary: "Exponentially smoothed market pressure to filter noise.", value: vm.oscillatorData.mps, signal: vm.oscillatorData.mps > 0 ? "Accumulation" : "Distribution", color: vm.oscillatorData.mps > 0 ? AppTheme.cyan : AppTheme.orange),
            IndicatorInfo(id: "ema", name: "EMA Cross", abbreviation: "EMA", category: "Trend", summary: "Fast/slow exponential moving average crossover trend signal.", value: 9.0, signal: "Golden Cross", color: AppTheme.gold),
            IndicatorInfo(id: "atr", name: "Average True Range", abbreviation: "ATR", category: "Volatility", summary: "Measures market volatility for stop placement and sizing.", value: 12.4, signal: "Elevated", color: AppTheme.purple),
            IndicatorInfo(id: "cloud", name: "Cloud Flip", abbreviation: "CLD", category: "Trend", summary: "Ichimoku-style cloud directional flip detection.", value: 1.0, signal: "Above Cloud", color: AppTheme.blue),
            IndicatorInfo(id: "comp", name: "Composite Score", abbreviation: "CMP", category: "Composite", summary: "Weighted blend of all indicators into one directional score.", value: vm.compositeScore, signal: vm.compositeScore > 2 ? "Strong Long" : vm.compositeScore < -2 ? "Strong Short" : "Neutral", color: vm.compositeScore > 0 ? AppTheme.green : AppTheme.red)
        ]
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                header
                compositeCard
                sectionLabel("ALL INDICATORS")
                ForEach(indicators) { ind in
                    indicatorCard(ind)
                }
            }
            .padding(.horizontal, 14)
            .padding(.bottom, 40)
        }
        .background(AppTheme.bg0)
        .sheet(item: $selected) { ind in
            indicatorDetail(ind)
        }
    }

    private var header: some View {
        HStack {
            Text("Indi")
                .font(.title2).fontWeight(.heavy).foregroundStyle(.white)
            + Text("cators")
                .font(.title2).fontWeight(.heavy).foregroundStyle(AppTheme.purple)
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: "waveform.path.ecg")
                    .font(.system(size: 11))
                Text(vm.selectedInstrument)
                    .font(.system(size: 11, weight: .bold))
            }
            .foregroundStyle(AppTheme.amber)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(Capsule().fill(AppTheme.amber.opacity(0.12)))
        }
        .padding(.top, 8)
    }

    private var compositeCard: some View {
        VStack(spacing: 10) {
            HStack {
                Text("COMPOSITE SIGNAL")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
                Spacer()
                Text(String(format: "%+.1f", vm.compositeScore))
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(vm.compositeScore > 0 ? AppTheme.green : AppTheme.red)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(AppTheme.bg3).frame(height: 8)
                    Capsule()
                        .fill(vm.compositeScore > 0 ? AppTheme.green : AppTheme.red)
                        .frame(width: max(8, geo.size.width * CGFloat((vm.compositeScore + 5) / 10)), height: 8)
                }
            }
            .frame(height: 8)
            Text(vm.compositeDesc)
                .font(.system(size: 11))
                .foregroundStyle(AppTheme.text2)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
    }

    private func sectionLabel(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)
            Spacer()
        }
    }

    private func indicatorCard(_ ind: IndicatorInfo) -> some View {
        Button {
            selected = ind
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(ind.color.opacity(0.12))
                    .frame(width: 44, height: 44)
                    .overlay {
                        Text(ind.abbreviation)
                            .font(.system(size: 13, weight: .heavy))
                            .foregroundStyle(ind.color)
                    }
                VStack(alignment: .leading, spacing: 3) {
                    Text(ind.name)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                    Text(ind.category)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 3) {
                    Text(String(format: "%.1f", ind.value))
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(.white)
                    Text(ind.signal)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(ind.color)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Capsule().fill(ind.color.opacity(0.12)))
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func indicatorDetail(_ ind: IndicatorInfo) -> some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 14) {
                        RoundedRectangle(cornerRadius: 14)
                            .fill(ind.color.opacity(0.15))
                            .frame(width: 60, height: 60)
                            .overlay {
                                Text(ind.abbreviation)
                                    .font(.system(size: 18, weight: .heavy))
                                    .foregroundStyle(ind.color)
                            }
                        VStack(alignment: .leading, spacing: 4) {
                            Text(ind.name)
                                .font(.system(size: 20, weight: .heavy))
                                .foregroundStyle(.white)
                            Text(ind.category)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(AppTheme.text2)
                        }
                    }

                    HStack(spacing: 12) {
                        detailStat(label: "Current", value: String(format: "%.2f", ind.value), color: .white)
                        detailStat(label: "Signal", value: ind.signal, color: ind.color)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("WHAT IT MEASURES")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(ind.color)
                            .tracking(1)
                        Text(ind.summary)
                            .font(.system(size: 14))
                            .foregroundStyle(AppTheme.text1)
                            .lineSpacing(4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(AppTheme.bg1)
                            .strokeBorder(AppTheme.border2, lineWidth: 1)
                    )

                    VStack(alignment: .leading, spacing: 8) {
                        Text("HOW TO TRADE IT")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(AppTheme.amber)
                            .tracking(1)
                        ForEach(tradingTips(for: ind), id: \.self) { tip in
                            HStack(alignment: .top, spacing: 8) {
                                Image(systemName: "arrow.right.circle.fill")
                                    .font(.system(size: 12))
                                    .foregroundStyle(AppTheme.amber)
                                    .padding(.top, 2)
                                Text(tip)
                                    .font(.system(size: 13))
                                    .foregroundStyle(AppTheme.text1)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(AppTheme.bg1)
                            .strokeBorder(AppTheme.border2, lineWidth: 1)
                    )
                }
                .padding(20)
            }
            .background(AppTheme.bg0)
            .navigationBarTitleDisplayMode(.inline)
        }
        .preferredColorScheme(.dark)
    }

    private func detailStat(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func tradingTips(for ind: IndicatorInfo) -> [String] {
        switch ind.category {
        case "Oscillator":
            return ["Look for divergence between price and the oscillator.", "Positive readings favor longs, negative favor shorts.", "Combine with trend filters to avoid chop."]
        case "Trend":
            return ["Trade in the direction of the established trend.", "Use crossovers as entry triggers.", "Avoid counter-trend entries during strong moves."]
        case "Volatility":
            return ["Widen stops when volatility is elevated.", "Reduce position size in high-ATR regimes.", "Tight ranges often precede breakouts."]
        default:
            return ["Use as a confirmation layer over your primary setup.", "Higher absolute scores mean stronger conviction.", "Wait for alignment across multiple indicators."]
        }
    }
}
