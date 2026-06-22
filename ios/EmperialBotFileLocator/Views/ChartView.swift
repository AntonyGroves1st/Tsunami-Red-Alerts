import SwiftUI

struct ChartView: View {
    let vm: AppViewModel
    @State private var selectedTicker: MarketTicker?
    @State private var timeframe: String = "1D"

    private let timeframes = ["1H", "4H", "1D", "1W", "1M"]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                if let ticker = selectedTicker ?? vm.marketTickers.first {
                    detailChart(ticker)
                }
                tickerList
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Market")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("Charts")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.cyan)
                Text("Live Market Data")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            HStack(spacing: 4) {
                Circle()
                    .fill(AppTheme.green)
                    .frame(width: 6, height: 6)
                Text("LIVE")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(AppTheme.green)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(AppTheme.green.opacity(0.1))
                    .strokeBorder(AppTheme.green.opacity(0.2), lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private func detailChart(_ ticker: MarketTicker) -> some View {
        VStack(spacing: 14) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(ticker.symbol)
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(.white)
                    Text(formatChartPrice(ticker.price))
                        .font(.system(size: 28, weight: .heavy))
                        .foregroundStyle(.white)
                    HStack(spacing: 6) {
                        Image(systemName: ticker.change24h >= 0 ? "arrow.up.right" : "arrow.down.right")
                            .font(.system(size: 11, weight: .bold))
                        Text(String(format: "%+.2f (%.2f%%)", ticker.change24h, ticker.changePercent24h))
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(ticker.change24h >= 0 ? AppTheme.green : AppTheme.red)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    statLabel("24H HIGH", value: formatChartPrice(ticker.high24h), color: AppTheme.green)
                    statLabel("24H LOW", value: formatChartPrice(ticker.low24h), color: AppTheme.red)
                    statLabel("VOLUME", value: vm.formatLargeNumber(ticker.volume24h), color: AppTheme.cyan)
                }
            }

            sparklineChart(data: ticker.sparkline, isPositive: ticker.change24h >= 0)
                .frame(height: 120)

            HStack(spacing: 6) {
                ForEach(timeframes, id: \.self) { tf in
                    Button {
                        timeframe = tf
                    } label: {
                        Text(tf)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(timeframe == tf ? .white : AppTheme.text2)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 7)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(timeframe == tf ? AppTheme.cyan.opacity(0.2) : AppTheme.bg2)
                            )
                    }
                }
            }

            Divider().background(AppTheme.border)

            HStack(spacing: 0) {
                miniStat(label: "OPEN", value: formatChartPrice(ticker.sparkline.first ?? 0))
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                Spacer()
                miniStat(label: "CLOSE", value: formatChartPrice(ticker.price))
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                Spacer()
                miniStat(label: "RANGE", value: formatChartPrice(ticker.high24h - ticker.low24h))
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private func sparklineChart(data: [Double], isPositive: Bool) -> some View {
        GeometryReader { geo in
            let minVal = data.min() ?? 0
            let maxVal = data.max() ?? 1
            let range = maxVal - minVal
            let stepX = geo.size.width / CGFloat(max(data.count - 1, 1))
            let color = isPositive ? AppTheme.green : AppTheme.red

            ZStack {
                Path { path in
                    for (i, val) in data.enumerated() {
                        let x = CGFloat(i) * stepX
                        let y = range > 0 ? geo.size.height * (1 - CGFloat((val - minVal) / range)) : geo.size.height / 2
                        if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                        else { path.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(color, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                Path { path in
                    for (i, val) in data.enumerated() {
                        let x = CGFloat(i) * stepX
                        let y = range > 0 ? geo.size.height * (1 - CGFloat((val - minVal) / range)) : geo.size.height / 2
                        if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                        else { path.addLine(to: CGPoint(x: x, y: y)) }
                    }
                    path.addLine(to: CGPoint(x: geo.size.width, y: geo.size.height))
                    path.addLine(to: CGPoint(x: 0, y: geo.size.height))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(colors: [color.opacity(0.3), color.opacity(0.0)], startPoint: .top, endPoint: .bottom)
                )
            }
        }
    }

    private func statLabel(_ label: String, value: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(color)
        }
    }

    private func miniStat(label: String, value: String) -> some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 8, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            Text(value)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(AppTheme.text1)
        }
    }

    private var tickerList: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ALL MARKETS")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            ForEach(vm.marketTickers) { ticker in
                Button {
                    withAnimation(.spring(duration: 0.3)) {
                        selectedTicker = ticker
                    }
                } label: {
                    tickerRow(ticker)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func tickerRow(_ ticker: MarketTicker) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(ticker.symbol)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppTheme.text1)
                Text("Vol: \(vm.formatLargeNumber(ticker.volume24h))")
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
            }

            Spacer()

            miniSparkline(data: ticker.sparkline, isPositive: ticker.change24h >= 0)
                .frame(width: 60, height: 24)

            VStack(alignment: .trailing, spacing: 2) {
                Text(formatChartPrice(ticker.price))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(AppTheme.text1)
                Text(String(format: "%+.2f%%", ticker.changePercent24h))
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(ticker.change24h >= 0 ? AppTheme.green : AppTheme.red)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        RoundedRectangle(cornerRadius: 4)
                            .fill((ticker.change24h >= 0 ? AppTheme.green : AppTheme.red).opacity(0.12))
                    )
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(selectedTicker?.id == ticker.id ? AppTheme.bg2 : AppTheme.bg1)
                .strokeBorder(selectedTicker?.id == ticker.id ? AppTheme.cyan.opacity(0.3) : AppTheme.border, lineWidth: 1)
        )
    }

    private func miniSparkline(data: [Double], isPositive: Bool) -> some View {
        GeometryReader { geo in
            let minVal = data.min() ?? 0
            let maxVal = data.max() ?? 1
            let range = maxVal - minVal
            let stepX = geo.size.width / CGFloat(max(data.count - 1, 1))

            Path { path in
                for (i, val) in data.enumerated() {
                    let x = CGFloat(i) * stepX
                    let y = range > 0 ? geo.size.height * (1 - CGFloat((val - minVal) / range)) : geo.size.height / 2
                    if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                    else { path.addLine(to: CGPoint(x: x, y: y)) }
                }
            }
            .stroke(isPositive ? AppTheme.green : AppTheme.red, style: StrokeStyle(lineWidth: 1.5, lineCap: .round, lineJoin: .round))
        }
    }

    private func formatChartPrice(_ value: Double) -> String {
        if value >= 1000 { return String(format: "$%.2f", value) }
        if value >= 1 { return String(format: "$%.2f", value) }
        return String(format: "$%.4f", value)
    }
}
