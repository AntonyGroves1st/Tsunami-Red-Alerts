import Foundation

enum MockDataService {
    static func mockTrades() -> [BotTrade] {
        let instruments = ["BTC", "ETH", "ES", "NQ", "GC", "SOL", "BNB"]
        let sources: [SignalSource] = [.emaCross, .goldenCross, .atrSignal, .rmpSignal, .pressureFlip, .composite]
        var trades: [BotTrade] = []
        let now = Date()

        for i in 0..<20 {
            let inst = instruments[i % instruments.count]
            let dir: SignalDirection = i % 3 == 0 ? .short : .long
            let src = sources[i % sources.count]
            let entry = Double.random(in: 100...50000)
            let current = entry * Double.random(in: 0.96...1.06)
            let pnlVal = dir == .long ? (current - entry) * Double.random(in: 0.1...2.0) : (entry - current) * Double.random(in: 0.1...2.0)
            let status: TradeStatus = i < 5 ? .open : (i < 15 ? .closed : .stopped)

            trades.append(BotTrade(
                id: "t_\(i)",
                signalId: "s_\(i)",
                instrument: inst,
                direction: dir,
                entryPrice: entry,
                currentPrice: current,
                exitPrice: status != .open ? current : nil,
                quantity: Double.random(in: 0.01...5.0),
                stopLoss: dir == .long ? entry * 0.98 : entry * 1.02,
                takeProfit: dir == .long ? entry * 1.04 : entry * 0.96,
                pnl: pnlVal,
                pnlPercent: (pnlVal / entry) * 100,
                status: status,
                openTime: now.addingTimeInterval(-Double(i * 3600)),
                closeTime: status != .open ? now.addingTimeInterval(-Double(i * 1800)) : nil,
                source: src,
                fees: Double.random(in: 0.5...5.0)
            ))
        }
        return trades
    }

    static func mockSignals() -> [TradingSignal] {
        let sources: [SignalSource] = [.emaCross, .goldenCross, .atrSignal, .rmpSignal, .pressureFlip, .composite]
        let instruments = ["BTC", "ETH", "ES", "NQ", "GC"]
        var signals: [TradingSignal] = []
        let now = Date()

        for i in 0..<12 {
            signals.append(TradingSignal(
                id: "sig_\(i)",
                instrument: instruments[i % instruments.count],
                direction: i % 2 == 0 ? .long : .short,
                source: sources[i % sources.count],
                confidence: Int.random(in: 55...95),
                entryPrice: Double.random(in: 100...50000),
                stopLoss: Double.random(in: 90...49000),
                takeProfit: Double.random(in: 110...52000),
                timestamp: now.addingTimeInterval(-Double(i * 1800)),
                executed: i < 4
            ))
        }
        return signals
    }

    static func defaultBrokers() -> [BrokerConfig] {
        [
            BrokerConfig(id: "tradingview", name: "TradingView", description: "Receive alerts from TradingView via webhook.", logo: "TV", isConnected: false, status: .disconnected, supportedFeatures: ["Webhook Alerts", "Pine Script Signals", "Custom Payloads", "Multi-Timeframe"], docsUrl: "https://www.tradingview.com/support/solutions/43000529348-about-webhooks/", color: "#2962FF"),
            BrokerConfig(id: "ninjatrader", name: "NinjaTrader", description: "Connect to NinjaTrader via API for automated order execution.", logo: "NT", isConnected: false, status: .disconnected, supportedFeatures: ["Order Execution", "Strategy Automation", "Market Data", "Account Management"], docsUrl: "https://ninjatrader.com/support/helpGuides/nt8/en-us/", color: "#FF6D00"),
            BrokerConfig(id: "rprotrader", name: "R Pro Trader", description: "Integrate with R Pro Trader for futures trading automation.", logo: "RP", isConnected: false, status: .disconnected, supportedFeatures: ["Futures Trading", "Webhook Integration", "Custom Signals", "Risk Management"], docsUrl: "#", color: "#00C853"),
            BrokerConfig(id: "binance", name: "Binance", description: "Connect to Binance for crypto futures trading.", logo: "BN", isConnected: false, status: .disconnected, supportedFeatures: ["Spot Trading", "Futures Trading", "Market Data", "Account Info"], docsUrl: "https://www.binance.com/en/support/faq/", color: "#F0B90B"),
            BrokerConfig(id: "discord", name: "Discord", description: "Push trading signals and alerts to Discord channels.", logo: "DC", isConnected: false, status: .disconnected, supportedFeatures: ["Channel Alerts", "Embedded Messages", "Role Mentions", "Rich Formatting"], docsUrl: "https://support.discord.com/hc/en-us/articles/228383668", color: "#5865F2"),
            BrokerConfig(id: "telegram", name: "Telegram", description: "Send real-time trading alerts to Telegram groups.", logo: "TG", isConnected: false, status: .disconnected, supportedFeatures: ["Bot Messages", "Group Alerts", "Channel Posts", "Inline Buttons"], docsUrl: "https://core.telegram.org/bots/api", color: "#0088CC"),
        ]
    }

    static func mockPortfolio() -> [PortfolioHolding] {
        [
            PortfolioHolding(id: "h1", symbol: "BTC", name: "Bitcoin", quantity: 0.5, avgCost: 42000, currentPrice: 43250),
            PortfolioHolding(id: "h2", symbol: "ETH", name: "Ethereum", quantity: 5.0, avgCost: 2200, currentPrice: 2350),
            PortfolioHolding(id: "h3", symbol: "SOL", name: "Solana", quantity: 50, avgCost: 95, currentPrice: 102),
            PortfolioHolding(id: "h4", symbol: "BNB", name: "Binance Coin", quantity: 10, avgCost: 310, currentPrice: 325),
        ]
    }

    static func mockAlerts() -> [PriceAlert] {
        let now = Date()
        return [
            PriceAlert(id: "al_1", symbol: "BTC", targetPrice: 45000, condition: .above, isActive: true, createdAt: now.addingTimeInterval(-86400), triggered: false),
            PriceAlert(id: "al_2", symbol: "ETH", targetPrice: 2000, condition: .below, isActive: true, createdAt: now.addingTimeInterval(-43200), triggered: false),
            PriceAlert(id: "al_3", symbol: "ES", targetPrice: 5000, condition: .crossUp, isActive: false, createdAt: now.addingTimeInterval(-172800), triggered: true),
            PriceAlert(id: "al_4", symbol: "GC", targetPrice: 2100, condition: .above, isActive: true, createdAt: now.addingTimeInterval(-7200), triggered: false),
        ]
    }

    static func mockMarketTickers() -> [MarketTicker] {
        [
            MarketTicker(id: "mk_btc", symbol: "BTC", name: "Bitcoin", exchange: "Binance", price: 43250, change24h: 850, changePercent24h: 2.01, high24h: 43500, low24h: 42100, volume24h: 28_500_000_000, sparkline: [42100, 42300, 42800, 43000, 42900, 43100, 43250], category: .crypto),
            MarketTicker(id: "mk_eth", symbol: "ETH", name: "Ethereum", exchange: "Binance", price: 2350, change24h: 45, changePercent24h: 1.95, high24h: 2380, low24h: 2290, volume24h: 15_200_000_000, sparkline: [2290, 2310, 2330, 2320, 2340, 2355, 2350], category: .crypto),
            MarketTicker(id: "mk_sol", symbol: "SOL", name: "Solana", exchange: "Binance", price: 102, change24h: 3.5, changePercent24h: 3.55, high24h: 104, low24h: 97, volume24h: 3_100_000_000, sparkline: [97, 98, 100, 99, 101, 103, 102], category: .crypto),
            MarketTicker(id: "mk_bnb", symbol: "BNB", name: "Binance Coin", exchange: "Binance", price: 325, change24h: -5, changePercent24h: -1.52, high24h: 332, low24h: 320, volume24h: 1_800_000_000, sparkline: [332, 330, 328, 325, 322, 324, 325], category: .crypto),
            MarketTicker(id: "mk_es", symbol: "ES", name: "E-mini S&P 500", exchange: "CME", price: 5150, change24h: 25, changePercent24h: 0.49, high24h: 5165, low24h: 5120, volume24h: 2_100_000, sparkline: [5120, 5130, 5140, 5135, 5145, 5155, 5150], category: .futures),
            MarketTicker(id: "mk_nq", symbol: "NQ", name: "E-mini Nasdaq 100", exchange: "CME", price: 18200, change24h: 150, changePercent24h: 0.83, high24h: 18300, low24h: 18000, volume24h: 1_500_000, sparkline: [18000, 18050, 18100, 18080, 18150, 18220, 18200], category: .futures),
            MarketTicker(id: "mk_gc", symbol: "GC", name: "Gold Futures", exchange: "COMEX", price: 2050, change24h: 12, changePercent24h: 0.59, high24h: 2060, low24h: 2035, volume24h: 250_000, sparkline: [2035, 2040, 2045, 2042, 2048, 2052, 2050], category: .futures),
            MarketTicker(id: "mk_cl", symbol: "CL", name: "Crude Oil", exchange: "NYMEX", price: 78.5, change24h: -1.2, changePercent24h: -1.51, high24h: 80.1, low24h: 78.0, volume24h: 350_000, sparkline: [80.1, 79.8, 79.5, 79.0, 78.5, 78.8, 78.5], category: .futures),
            MarketTicker(id: "mk_spx", symbol: "SPX", name: "S&P 500", exchange: "NYSE", price: 5148, change24h: 22, changePercent24h: 0.43, high24h: 5160, low24h: 5125, volume24h: 0, sparkline: [5125, 5130, 5140, 5138, 5145, 5150, 5148], category: .indices),
            MarketTicker(id: "mk_ndx", symbol: "NDX", name: "Nasdaq 100", exchange: "NASDAQ", price: 18150, change24h: 130, changePercent24h: 0.72, high24h: 18250, low24h: 18000, volume24h: 0, sparkline: [18000, 18030, 18080, 18060, 18120, 18160, 18150], category: .indices),
            MarketTicker(id: "mk_dji", symbol: "DJI", name: "Dow Jones", exchange: "NYSE", price: 38900, change24h: 180, changePercent24h: 0.46, high24h: 38950, low24h: 38700, volume24h: 0, sparkline: [38700, 38750, 38800, 38780, 38850, 38910, 38900], category: .indices),
            MarketTicker(id: "mk_vix", symbol: "VIX", name: "Volatility Index", exchange: "CBOE", price: 14.2, change24h: -0.5, changePercent24h: -3.40, high24h: 15.0, low24h: 14.0, volume24h: 0, sparkline: [15.0, 14.8, 14.6, 14.5, 14.3, 14.1, 14.2], category: .indices),
        ]
    }

    static func subscriptionPlans() -> [SubscriptionPlan] {
        [
            SubscriptionPlan(id: "starter", tier: .starter, name: "Starter", price: "$89", interval: "/mo", features: ["1s chart windows", "Core indicators", "Basic signals", "Webhook alerts (10/mo)"], accentColor: "blue"),
            SubscriptionPlan(id: "pro", tier: .pro, name: "Pro", price: "$180", interval: "/mo", features: ["Unlimited 1s charts", "Advanced indicators", "Trading Bot", "Unlimited webhooks", "Arbitrage previews"], accentColor: "amber"),
            SubscriptionPlan(id: "premium", tier: .premium, name: "Premium", price: "$350", interval: "/mo", features: ["Full bots suite", "Arbitrage scanner", "Advanced brokers", "Priority signals", "Family sharing"], accentColor: "gold"),
            SubscriptionPlan(id: "elite", tier: .elite, name: "Elite", price: "$450", interval: "/mo", features: ["All Premium features", "VIP access & priority support", "Dedicated account manager", "Custom bot strategies", "White-glove onboarding"], accentColor: "purple"),
        ]
    }

    static func calculatePerformance(from trades: [BotTrade]) -> BotPerformance {
        let closed = trades.filter { $0.status == .closed || $0.status == .stopped }
        let openT = trades.filter { $0.status == .open }
        let wins = closed.filter { $0.pnl > 0 }
        let losses = closed.filter { $0.pnl <= 0 }
        let totalPnl = trades.reduce(0) { $0 + $1.pnl }
        let avgWin = wins.isEmpty ? 0 : wins.reduce(0) { $0 + $1.pnl } / Double(wins.count)
        let avgLoss = losses.isEmpty ? 0 : losses.reduce(0) { $0 + $1.pnl } / Double(losses.count)
        let bestTrade = trades.map(\.pnl).max() ?? 0
        let worstTrade = trades.map(\.pnl).min() ?? 0
        let grossProfit = wins.reduce(0) { $0 + $1.pnl }
        let grossLoss = abs(losses.reduce(0) { $0 + $1.pnl })
        let profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? .infinity : 0)

        var maxDD = 0.0
        var peak = 0.0
        var cumPnl = 0.0
        for trade in closed {
            cumPnl += trade.pnl
            if cumPnl > peak { peak = cumPnl }
            let dd = peak - cumPnl
            if dd > maxDD { maxDD = dd }
        }

        let pnls = closed.map(\.pnl)
        let mean = pnls.isEmpty ? 0 : pnls.reduce(0, +) / Double(pnls.count)
        let variance = pnls.isEmpty ? 0 : pnls.reduce(0) { $0 + ($1 - mean) * ($1 - mean) } / Double(pnls.count)
        let stdDev = sqrt(variance)
        let sharpe = stdDev > 0 ? mean / stdDev : 0

        return BotPerformance(
            totalTrades: trades.count,
            openTrades: openT.count,
            closedTrades: closed.count,
            winCount: wins.count,
            lossCount: losses.count,
            winRate: closed.isEmpty ? 0 : Double(wins.count) / Double(closed.count) * 100,
            totalPnl: totalPnl,
            avgWin: avgWin,
            avgLoss: avgLoss,
            bestTrade: bestTrade,
            worstTrade: worstTrade,
            profitFactor: profitFactor,
            sharpeRatio: sharpe,
            maxDrawdown: maxDD,
            consecutiveWins: 0,
            consecutiveLosses: 0
        )
    }

    static func mockOscillatorData() -> OscillatorData {
        OscillatorData(
            mp: Double.random(in: -0.5...0.5),
            rmp: Double.random(in: -0.4...0.4),
            mps: Double.random(in: -0.3...0.3)
        )
    }

    static func mockSignalBadges() -> [SignalBadgeData] {
        [
            SignalBadgeData(id: "b1", text: "EMA Bull Cross", type: "long"),
            SignalBadgeData(id: "b2", text: "Cloud Bullish", type: "long"),
            SignalBadgeData(id: "b3", text: "ATR Expansion", type: "fire"),
            SignalBadgeData(id: "b4", text: "RMP Divergence", type: "short"),
            SignalBadgeData(id: "b5", text: "Golden Cross", type: "long"),
            SignalBadgeData(id: "b6", text: "High Volume", type: "fire"),
        ]
    }

    static func mockSecurityScore() -> SecurityScore {
        SecurityScore(score: 78, grade: "B+", issues: [
            "PIN lock not enabled",
            "Biometric authentication disabled",
        ])
    }

    static func mockAuditLog() -> [SecurityEvent] {
        let now = Date()
        return [
            SecurityEvent(id: "ev1", type: "login", message: "Successful login from iOS device", severity: "low", timestamp: now.addingTimeInterval(-300)),
            SecurityEvent(id: "ev2", type: "settings_change", message: "Auto-trade setting changed to ON", severity: "medium", timestamp: now.addingTimeInterval(-3600)),
            SecurityEvent(id: "ev3", type: "transaction", message: "Bot executed BTC LONG trade", severity: "low", timestamp: now.addingTimeInterval(-7200)),
            SecurityEvent(id: "ev4", type: "integrity_check", message: "App integrity check passed", severity: "low", timestamp: now.addingTimeInterval(-14400)),
            SecurityEvent(id: "ev5", type: "failed_auth", message: "Failed login attempt detected", severity: "high", timestamp: now.addingTimeInterval(-28800)),
        ]
    }

    static func defaultUser() -> UserProfile {
        UserProfile(
            displayName: "EmperialAI",
            email: "admin@emperialbot.com",
            avatarInitials: "EA",
            plan: .free,
            isMember: false,
            isAdmin: true,
            createdAt: Date().addingTimeInterval(-2_592_000),
            memberSince: nil
        )
    }
}
