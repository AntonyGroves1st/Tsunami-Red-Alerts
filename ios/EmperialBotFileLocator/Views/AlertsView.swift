import SwiftUI

struct AlertsView: View {
    @Bindable var vm: AppViewModel
    @State private var showAddAlert: Bool = false
    @State private var filterActive: Bool = false

    private var filteredAlerts: [PriceAlert] {
        filterActive ? vm.alerts.filter(\.isActive) : vm.alerts
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                summaryCard
                filterBar
                alertsList
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
        .sheet(isPresented: $showAddAlert) {
            AddAlertSheet(vm: vm, isPresented: $showAddAlert)
        }
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Price")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("Alerts")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.amber)
                Text("Custom Price Notifications")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            Button {
                showAddAlert = true
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                    Text("New")
                        .font(.system(size: 11, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(AppTheme.amber)
                )
            }
        }
        .padding(.top, 8)
    }

    private var summaryCard: some View {
        HStack(spacing: 0) {
            VStack(spacing: 3) {
                Text("TOTAL")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.5)
                Text("\(vm.alerts.count)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(AppTheme.text1)
            }
            .frame(maxWidth: .infinity)
            Rectangle().fill(AppTheme.border).frame(width: 1, height: 32)
            VStack(spacing: 3) {
                Text("ACTIVE")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.5)
                Text("\(vm.activeAlertsCount)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(AppTheme.green)
            }
            .frame(maxWidth: .infinity)
            Rectangle().fill(AppTheme.border).frame(width: 1, height: 32)
            VStack(spacing: 3) {
                Text("TRIGGERED")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.5)
                Text("\(vm.alerts.filter(\.triggered).count)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundStyle(AppTheme.amber)
            }
            .frame(maxWidth: .infinity)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border, lineWidth: 1)
        )
    }

    private var filterBar: some View {
        HStack {
            Text("ALERTS")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)
            Spacer()
            Button {
                withAnimation(.spring(duration: 0.3)) {
                    filterActive.toggle()
                }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: filterActive ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
                        .font(.system(size: 12))
                    Text(filterActive ? "Active Only" : "All")
                        .font(.system(size: 10, weight: .semibold))
                }
                .foregroundStyle(filterActive ? AppTheme.cyan : AppTheme.text2)
            }
        }
    }

    private var alertsList: some View {
        VStack(spacing: 8) {
            if filteredAlerts.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "bell.slash")
                        .font(.system(size: 32))
                        .foregroundStyle(AppTheme.text3)
                    Text("No alerts")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.text2)
                    Text("Tap '+New' to create a price alert")
                        .font(.caption)
                        .foregroundStyle(AppTheme.text3)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
            } else {
                ForEach(filteredAlerts) { alert in
                    alertRow(alert)
                }
            }
        }
    }

    private func alertRow(_ alert: PriceAlert) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(conditionColor(alert.condition).opacity(0.12))
                .frame(width: 40, height: 40)
                .overlay(
                    Image(systemName: conditionIcon(alert.condition))
                        .font(.system(size: 16))
                        .foregroundStyle(conditionColor(alert.condition))
                )

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(alert.symbol)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(AppTheme.text1)
                    Text(alert.condition.rawValue)
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(conditionColor(alert.condition))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(
                            RoundedRectangle(cornerRadius: 4)
                                .fill(conditionColor(alert.condition).opacity(0.12))
                        )
                    if alert.triggered {
                        Text("TRIGGERED")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundStyle(AppTheme.amber)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(
                                RoundedRectangle(cornerRadius: 3)
                                    .fill(AppTheme.amber.opacity(0.12))
                            )
                    }
                }
                Text(formatAlertPrice(alert.targetPrice))
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text2)
            }

            Spacer()

            VStack(spacing: 6) {
                Toggle("", isOn: Binding(
                    get: { alert.isActive },
                    set: { _ in vm.toggleAlert(alert.id) }
                ))
                .labelsHidden()
                .scaleEffect(0.75)
                .tint(AppTheme.green)

                Button {
                    withAnimation { vm.deleteAlert(alert.id) }
                } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 11))
                        .foregroundStyle(AppTheme.red.opacity(0.6))
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.bg1)
                .strokeBorder(alert.isActive ? conditionColor(alert.condition).opacity(0.15) : AppTheme.border, lineWidth: 1)
        )
        .opacity(alert.isActive ? 1 : 0.6)
    }

    private func conditionIcon(_ condition: AlertCondition) -> String {
        switch condition {
        case .above: return "arrow.up.circle"
        case .below: return "arrow.down.circle"
        case .crossUp: return "arrow.up.right.circle"
        case .crossDown: return "arrow.down.right.circle"
        }
    }

    private func conditionColor(_ condition: AlertCondition) -> Color {
        switch condition {
        case .above, .crossUp: return AppTheme.green
        case .below, .crossDown: return AppTheme.red
        }
    }

    private func formatAlertPrice(_ value: Double) -> String {
        if value >= 1000 { return String(format: "Target: $%.2f", value) }
        if value >= 1 { return String(format: "Target: $%.2f", value) }
        return String(format: "Target: $%.4f", value)
    }
}

struct AddAlertSheet: View {
    let vm: AppViewModel
    @Binding var isPresented: Bool
    @State private var selectedSymbol: String = "BTC"
    @State private var targetPrice: String = ""
    @State private var condition: AlertCondition = .above

    private let symbols = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "LINK", "DOT", "AVAX", "MATIC"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("SYMBOL")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(symbols, id: \.self) { sym in
                                    Button {
                                        selectedSymbol = sym
                                    } label: {
                                        Text(sym)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundStyle(selectedSymbol == sym ? .white : AppTheme.text2)
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 8)
                                            .background(
                                                RoundedRectangle(cornerRadius: 8)
                                                    .fill(selectedSymbol == sym ? AppTheme.cyan.opacity(0.3) : AppTheme.bg2)
                                                    .strokeBorder(selectedSymbol == sym ? AppTheme.cyan.opacity(0.4) : AppTheme.border, lineWidth: 1)
                                            )
                                    }
                                }
                            }
                        }
                        .contentMargins(.horizontal, 0)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("TARGET PRICE")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        HStack(spacing: 8) {
                            Image(systemName: "dollarsign.circle")
                                .font(.system(size: 16))
                                .foregroundStyle(AppTheme.text2)
                            TextField("Enter price", text: $targetPrice)
                                .foregroundStyle(AppTheme.text1)
                                .font(.system(size: 16, weight: .semibold))
                                .keyboardType(.decimalPad)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 10)
                                .fill(AppTheme.bg2)
                                .strokeBorder(AppTheme.border, lineWidth: 1)
                        )
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("CONDITION")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(AlertCondition.allCases, id: \.self) { cond in
                                Button {
                                    condition = cond
                                } label: {
                                    Text(cond.rawValue)
                                        .font(.system(size: 13, weight: .semibold))
                                        .foregroundStyle(condition == cond ? .white : AppTheme.text2)
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 10)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(condition == cond ? AppTheme.cyan.opacity(0.2) : AppTheme.bg2)
                                                .strokeBorder(condition == cond ? AppTheme.cyan.opacity(0.3) : AppTheme.border, lineWidth: 1)
                                        )
                                }
                            }
                        }
                    }

                    Button {
                        if let price = Double(targetPrice), price > 0 {
                            vm.addAlert(symbol: selectedSymbol, targetPrice: price, condition: condition)
                            isPresented = false
                        }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "bell.badge.fill")
                                .font(.system(size: 14))
                            Text("Create Alert")
                                .font(.system(size: 15, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(AppTheme.amber)
                        )
                    }
                }
                .padding(20)
            }
            .background(AppTheme.bg1)
            .navigationTitle("New Alert")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                        .foregroundStyle(AppTheme.text2)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
