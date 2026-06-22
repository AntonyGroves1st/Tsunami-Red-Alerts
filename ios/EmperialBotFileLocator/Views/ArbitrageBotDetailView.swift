import SwiftUI

struct ArbitrageBotDetailView: View {
    @Bindable var vm: AppViewModel
    @Environment(\.dismiss) private var dismiss

    private let pairs = [
        ("BTC", "Binance", 43250.00, "Coinbase", 43285.00, 35.00, 0.08),
        ("ETH", "Binance", 2350.00, "Kraken", 2353.50, 3.50, 0.15),
        ("SOL", "Binance", 102.00, "OKX", 102.35, 0.35, 0.34),
        ("BNB", "Binance", 325.00, "KuCoin", 325.80, 0.80, 0.25),
    ]

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button { dismiss() } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20))
                        .foregroundStyle(AppTheme.text1)
                        .frame(width: 36, height: 36)
                        .background(RoundedRectangle(cornerRadius: 10).fill(AppTheme.bg1).strokeBorder(AppTheme.border, lineWidth: 1))
                }
                (Text("Arbitrage").foregroundStyle(.white) + Text("Scanner").foregroundStyle(AppTheme.amber))
                    .font(.system(size: 18, weight: .heavy))
                Spacer()
                Toggle("", isOn: Binding(get: { vm.arbitrageBotEnabled }, set: { vm.arbitrageBotEnabled = $0 }))
                    .labelsHidden()
                    .tint(AppTheme.amber)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            ScrollView {
                VStack(spacing: 12) {
                    statusCard
                    spreadsSection
                    settingsCard
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 40)
            }
        }
        .background(AppTheme.bg0)
        .navigationBarBackButtonHidden()
    }

    private var statusCard: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(AppTheme.amber.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: "arrow.left.arrow.right")
                        .font(.system(size: 20))
                        .foregroundStyle(AppTheme.amber)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Cross-Exchange Scanner")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.white)
                    Text(vm.arbitrageBotEnabled ? "Scanning 4 pairs across 5 exchanges" : "Scanner offline")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
            }
            HStack(spacing: 8) {
                statBadge(label: "PAIRS", value: "4", color: AppTheme.amber)
                statBadge(label: "EXCHANGES", value: "5", color: AppTheme.cyan)
                statBadge(label: "SPREADS", value: "\(pairs.count)", color: AppTheme.green)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func statBadge(label: String, value: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(color)
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.06))
                .strokeBorder(color.opacity(0.2), lineWidth: 1)
        )
    }

    private var spreadsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "arrow.left.arrow.right")
                    .font(.system(size: 13))
                    .foregroundStyle(AppTheme.amber)
                Text("LIVE SPREADS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
            }
            ForEach(Array(pairs.enumerated()), id: \.offset) { _, pair in
                spreadRow(symbol: pair.0, exchangeA: pair.1, priceA: pair.2, exchangeB: pair.3, priceB: pair.4, spread: pair.5, spreadPct: pair.6)
            }
        }
    }

    private func spreadRow(symbol: String, exchangeA: String, priceA: Double, exchangeB: String, priceB: Double, spread: Double, spreadPct: Double) -> some View {
        VStack(spacing: 8) {
            HStack {
                Text(symbol)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(AppTheme.amber)
                Spacer()
                Text(String(format: "+$%.2f (%.2f%%)", spread, spreadPct))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(AppTheme.green)
            }
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(exchangeA)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(AppTheme.text2)
                    Text(String(format: "$%.2f", priceA))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(AppTheme.text1)
                }
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text3)
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(exchangeB)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(AppTheme.text2)
                    Text(String(format: "$%.2f", priceB))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(AppTheme.text1)
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var settingsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 6) {
                Image(systemName: "gearshape.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(AppTheme.amber)
                Text("SCANNER SETTINGS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
            }
            settingRow(label: "Min Spread", value: "0.05%", color: AppTheme.amber)
            settingRow(label: "Scan Interval", value: "5s", color: AppTheme.cyan)
            settingRow(label: "Auto-Execute", value: "OFF", color: AppTheme.red)
            settingRow(label: "Max Slippage", value: "0.1%", color: AppTheme.purple)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func settingRow(label: String, value: String, color: Color) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.text2)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(color)
        }
        .padding(.vertical, 6)
        .overlay(alignment: .bottom) {
            Rectangle().fill(AppTheme.border).frame(height: 0.5)
        }
    }
}
