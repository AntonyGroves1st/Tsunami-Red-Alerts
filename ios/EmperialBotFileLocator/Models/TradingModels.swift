import Foundation

nonisolated enum SignalDirection: String, Codable, Sendable, CaseIterable {
    case long = "LONG"
    case short = "SHORT"
}

nonisolated enum TradeStatus: String, Codable, Sendable {
    case pending, open, closed, cancelled, stopped
}

nonisolated enum SignalSource: String, Codable, Sendable, CaseIterable, Identifiable {
    case emaCross = "ema_cross"
    case goldenCross = "golden_cross"
    case deathCross = "death_cross"
    case atrSignal = "atr_signal"
    case rmpSignal = "rmp_signal"
    case pressureFlip = "pressure_flip"
    case cloudFlip = "cloud_flip"
    case composite
    case manual

    nonisolated var id: String { rawValue }

    var label: String {
        switch self {
        case .emaCross: return "EMA Cross"
        case .goldenCross: return "Golden Cross"
        case .deathCross: return "Death Cross"
        case .atrSignal: return "ATR Signal"
        case .rmpSignal: return "RMP Signal"
        case .pressureFlip: return "Pressure Flip"
        case .cloudFlip: return "Cloud Flip"
        case .composite: return "Composite"
        case .manual: return "Manual"
        }
    }
}

nonisolated enum RiskLevel: String, Codable, Sendable, CaseIterable {
    case conservative, moderate, aggressive
}

nonisolated enum BrokerStatus: String, Sendable {
    case connected, disconnected, error, pending
}

nonisolated enum AlertCondition: String, Codable, Sendable, CaseIterable {
    case above = "Above"
    case below = "Below"
    case crossUp = "Cross Up"
    case crossDown = "Cross Down"
}

nonisolated enum SubscriptionTier: String, Sendable, CaseIterable {
    case free = "Free"
    case starter = "Starter"
    case pro = "Pro"
    case premium = "Premium"
    case elite = "Elite"
}

nonisolated enum MarketSegment: String, CaseIterable {
    case all = "All"
    case indices = "Indices"
    case futures = "Futures"
    case crypto = "Crypto"
}

struct TradingSignal: Identifiable, Sendable {
    let id: String
    let instrument: String
    let direction: SignalDirection
    let source: SignalSource
    let confidence: Int
    let entryPrice: Double
    let stopLoss: Double
    let takeProfit: Double
    let timestamp: Date
    var executed: Bool
}

struct BotTrade: Identifiable, Sendable {
    let id: String
    let signalId: String
    let instrument: String
    let direction: SignalDirection
    var entryPrice: Double
    var currentPrice: Double
    var exitPrice: Double?
    let quantity: Double
    var stopLoss: Double
    var takeProfit: Double
    var pnl: Double
    var pnlPercent: Double
    var status: TradeStatus
    let openTime: Date
    var closeTime: Date?
    let source: SignalSource
    let fees: Double
}

struct BotPerformance: Sendable {
    let totalTrades: Int
    let openTrades: Int
    let closedTrades: Int
    let winCount: Int
    let lossCount: Int
    let winRate: Double
    let totalPnl: Double
    let avgWin: Double
    let avgLoss: Double
    let bestTrade: Double
    let worstTrade: Double
    let profitFactor: Double
    let sharpeRatio: Double
    let maxDrawdown: Double
    let consecutiveWins: Int
    let consecutiveLosses: Int
}

struct BrokerConfig: Identifiable, Sendable {
    let id: String
    let name: String
    let description: String
    let logo: String
    var isConnected: Bool
    var status: BrokerStatus
    let supportedFeatures: [String]
    let docsUrl: String
    let color: String
}

struct PortfolioHolding: Identifiable, Sendable {
    let id: String
    let symbol: String
    let name: String
    let quantity: Double
    let avgCost: Double
    let currentPrice: Double
    var pnl: Double { (currentPrice - avgCost) * quantity }
    var pnlPercent: Double { avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0 }
    var totalValue: Double { currentPrice * quantity }
}

struct PriceAlert: Identifiable, Sendable {
    let id: String
    let symbol: String
    var targetPrice: Double
    var condition: AlertCondition
    var isActive: Bool
    let createdAt: Date
    var triggered: Bool
}

struct MarketTicker: Identifiable, Sendable {
    let id: String
    let symbol: String
    let name: String
    let exchange: String
    let price: Double
    let change24h: Double
    let changePercent24h: Double
    let high24h: Double
    let low24h: Double
    let volume24h: Double
    let sparkline: [Double]
    let category: MarketSegment
}

struct SubscriptionPlan: Identifiable, Sendable {
    let id: String
    let tier: SubscriptionTier
    let name: String
    let price: String
    let interval: String
    let features: [String]
    let accentColor: String
}

struct SecurityScore: Sendable {
    let score: Int
    let grade: String
    let issues: [String]
}

struct SecurityEvent: Identifiable, Sendable {
    let id: String
    let type: String
    let message: String
    let severity: String
    let timestamp: Date
}

struct OscillatorData: Sendable {
    let mp: Double
    let rmp: Double
    let mps: Double
}

struct SignalBadgeData: Identifiable, Sendable {
    let id: String
    let text: String
    let type: String
}

struct UserProfile: Sendable {
    let displayName: String
    let email: String
    let avatarInitials: String
    var plan: SubscriptionTier
    var isMember: Bool
    var isAdmin: Bool
    let createdAt: Date
    var memberSince: Date?
}

struct InstrumentSpec: Identifiable, Sendable {
    let id: String
    let symbol: String
    let name: String
    let exchange: String
    let basePrice: Double
    let tick: Double
    let tickVal: Double
    let category: MarketSegment
}
