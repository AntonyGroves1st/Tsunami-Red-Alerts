import SwiftUI

struct MarketsView: View {
    let vm: AppViewModel
    @State private var searchText: String = ""
    @State private var selectedSegment: MarketSegment = .all

    private var filteredTickers: [MarketTicker] {
        var tickers = vm.marketTickers
        if selectedSegment != .all {
            tickers = tickers.filter { $0.category == selectedSegment }
        }
        if !searchText.isEmpty {
            let q = searchText.lowercased()
            tickers = tickers.filter {
                $0.symbol.lowercased().contains(q) ||
                $0.name.lowercased().contains(q) ||
                $0.exchange.lowercased().contains(q)
            }
        }
        return tickers
    }

    private var segmentCounts: [MarketSegment: Int] {
        var counts: [MarketSegment: Int] = [:]
        for seg in MarketSegment.allCases {
            if seg == .all {
                counts[seg] = vm.marketTickers.count
            } else {
                counts[seg] = vm.marketTickers.filter { $0.category == seg }.count
            }
        }
        return counts
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            segmentBar
            searchBar
            tickerList
        }
        .background(AppTheme.bg0)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Markets")
                .font(.system(size: 18, weight: .heavy))
                .foregroundStyle(AppTheme.amber)
                .tracking(0.5)
            Text("\(vm.marketTickers.count) instruments · \(vm.marketTickers.filter { $0.category == .crypto }.count) with live data")
                .font(.system(size: 12))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(AppTheme.bg1)
        .overlay(alignment: .bottom) {
            Rectangle().fill(AppTheme.border).frame(height: 1)
        }
    }

    private var segmentBar: some View {
        HStack(spacing: 6) {
            ForEach(MarketSegment.allCases, id: \.self) { seg in
                Button {
                    selectedSegment = seg
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: segmentIcon(seg))
                            .font(.system(size: 12))
                        Text(seg.rawValue)
                            .font(.system(size: 12, weight: .semibold))
                        Text("\(segmentCounts[seg] ?? 0)")
                            .font(.system(size: 11, weight: .bold))
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(selectedSegment == seg ? AppTheme.amber.opacity(0.15) : AppTheme.bg3)
                            )
                    }
                    .foregroundStyle(selectedSegment == seg ? AppTheme.amber : AppTheme.text2)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(selectedSegment == seg ? AppTheme.amber.opacity(0.08) : AppTheme.bg2)
                            .strokeBorder(selectedSegment == seg ? AppTheme.amber.opacity(0.3) : AppTheme.border, lineWidth: 1)
                    )
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 4)
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14))
                .foregroundStyle(AppTheme.text2)
            TextField("Search instruments...", text: $searchText)
                .font(.system(size: 14))
                .foregroundStyle(.white)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    private var tickerList: some View {
        ScrollView {
            LazyVStack(spacing: 4) {
                if filteredTickers.isEmpty {
                    VStack(spacing: 10) {
                        Text("No instruments found")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                        Text(searchText.isEmpty ? "No instruments in this category" : "Try a different search term")
                            .font(.system(size: 13))
                            .foregroundStyle(AppTheme.text3)
                    }
                    .padding(.vertical, 40)
                } else {
                    ForEach(filteredTickers) { ticker in
                        tickerRow(ticker)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
    }

    private func tickerRow(_ ticker: MarketTicker) -> some View {
        let isSelected = vm.selectedInstrument == ticker.symbol
        let isPositive = ticker.changePercent24h >= 0
        let assetColor = instrumentColor(ticker.symbol)

        return Button {
            vm.selectedInstrument = ticker.symbol
        } label: {
            HStack(spacing: 8) {
                Circle()
                    .fill(assetColor)
                    .frame(width: 8, height: 8)
                VStack(alignment: .leading, spacing: 1) {
                    Text(ticker.symbol)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(isSelected ? assetColor : .white)
                    Text(ticker.name)
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text2)
                        .lineLimit(1)
                }
                Spacer()
                if ticker.category == .crypto {
                    HStack(spacing: 3) {
                        Image(systemName: "wifi")
                            .font(.system(size: 9))
                        Text("LIVE")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(0.5)
                    }
                    .foregroundStyle(AppTheme.green)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        RoundedRectangle(cornerRadius: 4)
                            .fill(AppTheme.green.opacity(0.1))
                            .strokeBorder(AppTheme.green.opacity(0.25), lineWidth: 1)
                    )
                } else {
                    HStack(spacing: 3) {
                        Image(systemName: ticker.category == .indices ? "waveform.path.ecg" : "globe")
                            .font(.system(size: 9))
                        Text(ticker.category == .indices ? "IDX" : "MKT")
                            .font(.system(size: 11, weight: .bold))
                            .tracking(0.5)
                    }
                    .foregroundStyle(ticker.category == .indices ? AppTheme.cyan : AppTheme.blue)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        RoundedRectangle(cornerRadius: 4)
                            .fill((ticker.category == .indices ? AppTheme.cyan : AppTheme.blue).opacity(0.1))
                            .strokeBorder((ticker.category == .indices ? AppTheme.cyan : AppTheme.blue).opacity(0.25), lineWidth: 1)
                    )
                }
                VStack(alignment: .trailing, spacing: 1) {
                    Text(ticker.exchange)
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.text3)
                        .tracking(0.5)
                    Text(vm.formatPrice(ticker.price))
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(AppTheme.text2)
                    if ticker.changePercent24h != 0 {
                        HStack(spacing: 2) {
                            Image(systemName: isPositive ? "arrow.up.right" : "arrow.down.right")
                                .font(.system(size: 8))
                            Text(String(format: "%@%.2f%%", isPositive ? "+" : "", ticker.changePercent24h))
                                .font(.system(size: 11, weight: .semibold))
                        }
                        .foregroundStyle(isPositive ? AppTheme.green : AppTheme.red)
                    }
                }
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 14))
                        .foregroundStyle(AppTheme.amber)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? AppTheme.bg2 : AppTheme.bg1)
                    .strokeBorder(isSelected ? AppTheme.amber.opacity(0.4) : AppTheme.border, lineWidth: 1)
            )
        }
    }

    private func segmentIcon(_ seg: MarketSegment) -> String {
        switch seg {
        case .all: return "globe"
        case .indices: return "waveform.path.ecg"
        case .futures: return "arrow.up.arrow.down"
        case .crypto: return "wifi"
        }
    }

    private func instrumentColor(_ symbol: String) -> Color {
        switch symbol {
        case "BTC": return AppTheme.amber
        case "ETH": return AppTheme.purple
        case "SOL": return AppTheme.cyan
        case "BNB": return Color(red: 0.94, green: 0.72, blue: 0.04)
        case "ES", "SPX": return AppTheme.blue
        case "NQ", "NDX": return AppTheme.green
        case "GC": return AppTheme.gold
        case "CL": return AppTheme.orange
        case "VIX": return AppTheme.red
        default: return AppTheme.text2
        }
    }
}
