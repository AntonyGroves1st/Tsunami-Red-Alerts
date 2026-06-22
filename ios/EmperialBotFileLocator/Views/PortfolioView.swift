import SwiftUI

struct PortfolioView: View {
    let vm: AppViewModel
    @State private var sortBy: SortOption = .value

    private enum SortOption: String, CaseIterable {
        case value = "Value"
        case pnl = "P&L"
        case name = "Name"
    }

    private var sortedHoldings: [PortfolioHolding] {
        switch sortBy {
        case .value: return vm.portfolio.sorted { $0.totalValue > $1.totalValue }
        case .pnl: return vm.portfolio.sorted { $0.pnl > $1.pnl }
        case .name: return vm.portfolio.sorted { $0.symbol < $1.symbol }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                summaryCard
                allocationSection
                holdingsSection
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Port")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("folio")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.cyan)
                Text("Holdings & Allocation")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: "briefcase.fill")
                    .font(.system(size: 11))
                Text("\(vm.portfolio.count) assets")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(AppTheme.purple)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.purple.opacity(0.1))
                    .strokeBorder(AppTheme.purple.opacity(0.2), lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private var summaryCard: some View {
        VStack(spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("TOTAL VALUE")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                        .tracking(1)
                    Text(vm.formatLargeNumber(vm.totalPortfolioValue))
                        .font(.system(size: 32, weight: .heavy))
                        .foregroundStyle(.white)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    Text("UNREALIZED P&L")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                        .tracking(1)
                    Text(vm.formatPnl(vm.totalPortfolioPnl))
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(vm.totalPortfolioPnl >= 0 ? AppTheme.green : AppTheme.red)
                }
            }

            Divider().background(AppTheme.border)

            HStack(spacing: 0) {
                VStack(spacing: 3) {
                    Text("ASSETS")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                    Text("\(vm.portfolio.count)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(AppTheme.text1)
                }
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                Spacer()
                VStack(spacing: 3) {
                    Text("PROFITABLE")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                    Text("\(vm.portfolio.filter { $0.pnl > 0 }.count)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(AppTheme.green)
                }
                Spacer()
                Rectangle().fill(AppTheme.border).frame(width: 1, height: 28)
                Spacer()
                VStack(spacing: 3) {
                    Text("LOSING")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(AppTheme.text2)
                    Text("\(vm.portfolio.filter { $0.pnl < 0 }.count)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(AppTheme.red)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var allocationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ALLOCATION")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)

            let total = vm.totalPortfolioValue
            let colors: [Color] = [AppTheme.cyan, AppTheme.green, AppTheme.purple, AppTheme.amber, AppTheme.pink, AppTheme.orange, Color.blue, Color.mint]

            GeometryReader { geo in
                HStack(spacing: 2) {
                    ForEach(Array(sortedHoldings.enumerated()), id: \.element.id) { idx, holding in
                        let pct = total > 0 ? holding.totalValue / total : 0
                        RoundedRectangle(cornerRadius: 3)
                            .fill(colors[idx % colors.count])
                            .frame(width: max(geo.size.width * pct - 2, 4))
                    }
                }
            }
            .frame(height: 8)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                ForEach(Array(sortedHoldings.prefix(6).enumerated()), id: \.element.id) { idx, holding in
                    let pct = total > 0 ? holding.totalValue / total * 100 : 0
                    HStack(spacing: 6) {
                        Circle()
                            .fill(colors[idx % colors.count])
                            .frame(width: 8, height: 8)
                        Text(holding.symbol)
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text1)
                        Spacer()
                        Text(String(format: "%.1f%%", pct))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(AppTheme.text2)
                    }
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var holdingsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("HOLDINGS")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(1)
                Spacer()
                HStack(spacing: 4) {
                    ForEach(SortOption.allCases, id: \.self) { option in
                        Button {
                            sortBy = option
                        } label: {
                            Text(option.rawValue)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundStyle(sortBy == option ? .white : AppTheme.text2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(
                                    RoundedRectangle(cornerRadius: 5)
                                        .fill(sortBy == option ? AppTheme.cyan.opacity(0.2) : Color.clear)
                                )
                        }
                    }
                }
            }

            ForEach(sortedHoldings) { holding in
                holdingRow(holding)
            }
        }
    }

    private func holdingRow(_ holding: PortfolioHolding) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(holding.symbol)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(AppTheme.text1)
                Text(holding.name)
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(vm.formatLargeNumber(holding.totalValue))
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(AppTheme.text1)
                HStack(spacing: 4) {
                    Text(vm.formatPnl(holding.pnl))
                        .font(.system(size: 10, weight: .semibold))
                    Text(String(format: "(%.1f%%)", holding.pnlPercent))
                        .font(.system(size: 10))
                }
                .foregroundStyle(holding.pnl >= 0 ? AppTheme.green : AppTheme.red)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }
}
