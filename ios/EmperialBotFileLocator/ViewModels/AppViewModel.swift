import SwiftUI

@Observable
final class AppViewModel {
    var trades: [BotTrade] = MockDataService.mockTrades()
    var signals: [TradingSignal] = MockDataService.mockSignals()
    var brokers: [BrokerConfig] = MockDataService.defaultBrokers()
    var portfolio: [PortfolioHolding] = MockDataService.mockPortfolio()
    var alerts: [PriceAlert] = MockDataService.mockAlerts()
    var marketTickers: [MarketTicker] = MockDataService.mockMarketTickers()
    var subscriptionPlans: [SubscriptionPlan] = MockDataService.subscriptionPlans()
    var oscillatorData: OscillatorData = MockDataService.mockOscillatorData()
    var signalBadges: [SignalBadgeData] = MockDataService.mockSignalBadges()
    var securityScore: SecurityScore = MockDataService.mockSecurityScore()
    var auditLog: [SecurityEvent] = MockDataService.mockAuditLog()
    var user: UserProfile = MockDataService.defaultUser()

    var botEnabled: Bool = true
    var arbitrageBotEnabled: Bool = false
    var autoTradeOn: Bool = true
    var riskLevel: RiskLevel = .moderate
    var currentTier: SubscriptionTier = .free
    var notificationsEnabled: Bool = true
    var hapticFeedbackEnabled: Bool = true
    var liveMode: Bool = false
    var dataSource: String = "cached"
    var scanCount: Int = 0
    var execSpeed: Int = 142

    var isLoggedIn: Bool = true
    var showLogin: Bool = false

    var pinEnabled: Bool = false
    var biometricEnabled: Bool = false
    var autoLockOnBackground: Bool = false
    var sessionTimeoutMinutes: Int = 30
    var transactionAlerts: Bool = true

    var selectedInstrument: String = "BTC"
    var selectedTimeframe: String = "1H"
    var compositeScore: Double = 3.2

    var compositeDesc: String {
        if compositeScore > 2 { return "Bullish Bias — Multiple indicators align long" }
        if compositeScore < -2 { return "Bearish Bias — Multiple indicators align short" }
        return "Neutral — Mixed signals across indicators"
    }

    var performance: BotPerformance {
        MockDataService.calculatePerformance(from: trades)
    }

    var openTrades: [BotTrade] {
        trades.filter { $0.status == .open }
    }

    var closedTrades: [BotTrade] {
        trades.filter { $0.status == .closed || $0.status == .stopped }
    }

    var connectedBrokersCount: Int {
        brokers.filter(\.isConnected).count
    }

    var totalPortfolioValue: Double {
        portfolio.reduce(0) { $0 + $1.totalValue }
    }

    var totalPortfolioPnl: Double {
        portfolio.reduce(0) { $0 + $1.pnl }
    }

    var activeAlertsCount: Int {
        alerts.filter(\.isActive).count
    }

    func toggleBrokerConnection(_ id: String) {
        guard let idx = brokers.firstIndex(where: { $0.id == id }) else { return }
        brokers[idx].isConnected.toggle()
        brokers[idx].status = brokers[idx].isConnected ? .connected : .disconnected
    }

    func toggleAlert(_ id: String) {
        guard let idx = alerts.firstIndex(where: { $0.id == id }) else { return }
        alerts[idx].isActive.toggle()
    }

    func deleteAlert(_ id: String) {
        alerts.removeAll { $0.id == id }
    }

    func addAlert(symbol: String, targetPrice: Double, condition: AlertCondition) {
        let alert = PriceAlert(
            id: "al_\(UUID().uuidString.prefix(6))",
            symbol: symbol,
            targetPrice: targetPrice,
            condition: condition,
            isActive: true,
            createdAt: Date(),
            triggered: false
        )
        alerts.insert(alert, at: 0)
    }

    func tickBot() {
        guard botEnabled else { return }
        scanCount += 1
        execSpeed = Int.random(in: 80...330)
        oscillatorData = MockDataService.mockOscillatorData()
        compositeScore = Double.random(in: -5...5)

        for i in trades.indices {
            guard trades[i].status == .open else { continue }
            let noise = trades[i].entryPrice * Double.random(in: -0.01...0.01)
            trades[i].currentPrice += noise
            let diff = trades[i].direction == .long
                ? trades[i].currentPrice - trades[i].entryPrice
                : trades[i].entryPrice - trades[i].currentPrice
            trades[i].pnl = diff * trades[i].quantity
            trades[i].pnlPercent = (diff / trades[i].entryPrice) * 100
        }
    }

    func login(email: String, password: String) -> Bool {
        isLoggedIn = true
        showLogin = false
        return true
    }

    func logout() {
        isLoggedIn = false
        showLogin = true
    }

    func formatPrice(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "$%.2f", value)
        } else if value >= 1 {
            return String(format: "$%.4f", value)
        } else {
            return String(format: "$%.6f", value)
        }
    }

    func formatPnl(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)$\(String(format: "%.2f", value))"
    }

    func formatLargeNumber(_ value: Double) -> String {
        if value >= 1_000_000_000 {
            return String(format: "$%.1fB", value / 1_000_000_000)
        } else if value >= 1_000_000 {
            return String(format: "$%.1fM", value / 1_000_000)
        } else if value >= 1000 {
            return String(format: "$%.1fK", value / 1000)
        }
        return String(format: "$%.2f", value)
    }

    func formatVolume(_ vol: Double) -> String {
        if vol >= 1e9 { return String(format: "%.1fB", vol / 1e9) }
        if vol >= 1e6 { return String(format: "%.1fM", vol / 1e6) }
        if vol >= 1e3 { return String(format: "%.1fK", vol / 1e3) }
        return String(format: "%.1f", vol)
    }
}
