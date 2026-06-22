import SwiftUI

struct ContentView: View {
    @State private var vm = AppViewModel()
    @State private var selectedTab: Int = 0

    var body: some View {
        Group {
            if vm.isLoggedIn {
                mainTabView
            } else {
                LoginView(vm: vm)
            }
        }
        .preferredColorScheme(.dark)
    }

    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            Tab(value: 0) {
                DashboardView(vm: vm)
            } label: {
                Label("Dashboard", systemImage: "chart.bar.fill")
            }

            Tab(value: 1) {
                ChartView(vm: vm)
            } label: {
                Label("Chart", systemImage: "chart.xyaxis.line")
            }

            Tab(value: 2) {
                SignalsView(vm: vm)
            } label: {
                Label("Signals", systemImage: "antenna.radiowaves.left.and.right")
            }

            Tab(value: 9) {
                IndicatorsView(vm: vm)
            } label: {
                Label("Indicators", systemImage: "waveform.path.ecg")
            }

            Tab(value: 3) {
                MarketsView(vm: vm)
            } label: {
                Label("Markets", systemImage: "globe")
            }

            Tab(value: 4) {
                BotsView(vm: vm)
            } label: {
                Label("Bot", systemImage: "cpu")
            }

            Tab(value: 5) {
                BrokersView(vm: vm)
            } label: {
                Label("Brokers", systemImage: "link.circle.fill")
            }

            Tab(value: 6) {
                SecurityView(vm: vm)
            } label: {
                Label("Security", systemImage: "shield.fill")
            }

            Tab(value: 7) {
                HelpView()
            } label: {
                Label("Help", systemImage: "questionmark.circle.fill")
            }

            Tab(value: 8) {
                ProfileView(vm: vm)
            } label: {
                Label("Profile", systemImage: "person.fill")
            }
        }
        .tint(AppTheme.amber)
    }
}
