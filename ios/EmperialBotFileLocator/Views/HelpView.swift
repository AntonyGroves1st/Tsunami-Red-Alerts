import SwiftUI

struct HelpView: View {
    @State private var expandedItems: Set<String> = []

    private let helpSections: [(title: String, icon: String, items: [(id: String, q: String, a: String)])] = [
        (title: "Getting Started", icon: "play.circle.fill", items: [
            ("gs1", "What is EmperialBot?", "EmperialBot is an automated trading signal platform that monitors markets, generates trading signals using multiple technical analysis strategies, and can execute trades through connected brokers."),
            ("gs2", "How do I start trading?", "1. Connect a broker from the Brokers tab\n2. Enable the Trading Bot from the Bots tab\n3. Configure your risk level\n4. The bot will automatically generate and execute signals"),
        ]),
        (title: "Brokers", icon: "link.circle.fill", items: [
            ("br1", "Which brokers are supported?", "EmperialBot supports TradingView (webhook), NinjaTrader (API), R Pro Trader (webhook), and Binance (API) for trading. Discord and Telegram are supported for notifications."),
            ("br2", "How do webhooks work?", "Webhook-based brokers receive HTTP POST requests when signals fire. Copy the webhook URL from the Brokers tab and paste it into your broker's alert webhook settings."),
            ("br3", "Are my API keys secure?", "API keys are stored locally on your device only. They are never transmitted to our servers. Always use API keys with restricted permissions."),
        ]),
        (title: "Trading Bots", icon: "cpu", items: [
            ("tb1", "What is the Trading Bot?", "The Trading Bot monitors markets using multiple signal sources (EMA Cross, Golden Cross, ATR, RMP, etc.) and automatically executes trades when high-confidence signals are detected."),
            ("tb2", "What risk levels are available?", "Conservative: Small positions, tight stops. Moderate: Balanced risk/reward. Aggressive: Larger positions, wider stops for bigger potential gains."),
            ("tb3", "What is the Arbitrage Bot?", "The Arbitrage Bot scans for price differences across connected exchanges and exploits spread differentials for risk-free profit opportunities."),
        ]),
        (title: "Signals", icon: "antenna.radiowaves.left.and.right", items: [
            ("sg1", "What signal sources are used?", "EMA Cross, Golden Cross, Death Cross, ATR Signal, RMP Signal, Pressure Flip, Cloud Flip, Composite (combines multiple), and Manual signals."),
            ("sg2", "What does confidence mean?", "Confidence is a score from 0-100% indicating how strongly the technical indicators align for a given trade setup. Higher confidence = stronger signal."),
            ("sg3", "How are stop loss and take profit calculated?", "Stop loss and take profit levels are calculated based on your risk level setting and the entry price. Conservative uses tighter levels, aggressive uses wider levels."),
        ]),
    ]

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection

                ForEach(helpSections, id: \.title) { section in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 8) {
                            Image(systemName: section.icon)
                                .font(.system(size: 14))
                                .foregroundStyle(AppTheme.cyan)
                            Text(section.title.uppercased())
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(AppTheme.text2)
                                .tracking(1)
                        }

                        ForEach(section.items, id: \.id) { item in
                            helpItemCard(item)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
    }

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Help")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(.white)
                + Text("Center")
                    .font(.title2)
                    .fontWeight(.heavy)
                    .foregroundStyle(AppTheme.cyan)
                Text("Learn how to use EmperialBot")
                    .font(.caption)
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
        }
        .padding(.top, 8)
    }

    private func helpItemCard(_ item: (id: String, q: String, a: String)) -> some View {
        let isExpanded = expandedItems.contains(item.id)
        return Button {
            withAnimation(.spring(duration: 0.3)) {
                if isExpanded {
                    expandedItems.remove(item.id)
                } else {
                    expandedItems.insert(item.id)
                }
            }
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text(item.q)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(AppTheme.text1)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(AppTheme.text2)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(14)

                if isExpanded {
                    Text(item.a)
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text2)
                        .lineSpacing(4)
                        .padding(.horizontal, 14)
                        .padding(.bottom, 14)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(AppTheme.bg1)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
