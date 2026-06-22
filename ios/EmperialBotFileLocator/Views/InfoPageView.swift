import SwiftUI

enum InfoPageKind: String, Identifiable {
    case terms, privacy, about
    var id: String { rawValue }

    var title: String {
        switch self {
        case .terms: return "Terms of Service"
        case .privacy: return "Privacy Policy"
        case .about: return "About"
        }
    }
}

struct InfoPageSection: Identifiable {
    let id = UUID()
    let heading: String
    let body: String
}

struct InfoPageView: View {
    let kind: InfoPageKind
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if kind == .about {
                        aboutHeader
                    }
                    ForEach(sections) { section in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(section.heading)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(AppTheme.amber)
                            Text(section.body)
                                .font(.system(size: 14))
                                .foregroundStyle(AppTheme.text1)
                                .lineSpacing(5)
                        }
                    }
                    Text("Last updated: June 2026")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text3)
                        .padding(.top, 8)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(20)
                .padding(.bottom, 40)
            }
            .background(AppTheme.bg0)
            .navigationTitle(kind.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(AppTheme.amber)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var aboutHeader: some View {
        VStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 20)
                .fill(AppTheme.amber)
                .frame(width: 72, height: 72)
                .overlay {
                    Text("E")
                        .font(.system(size: 38, weight: .black))
                        .foregroundStyle(AppTheme.bg0)
                }
            (Text("Emperial").foregroundStyle(.white) + Text("Bot").foregroundStyle(AppTheme.amber))
                .font(.system(size: 24, weight: .heavy))
            Text("Version 1.0.0 (Build 1)")
                .font(.system(size: 13))
                .foregroundStyle(AppTheme.text2)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 8)
    }

    private var sections: [InfoPageSection] {
        switch kind {
        case .terms:
            return [
                InfoPageSection(heading: "1. Acceptance of Terms", body: "By accessing EmperialBot you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, you may not use the app."),
                InfoPageSection(heading: "2. Trading Risk Disclosure", body: "Trading futures, options, and crypto carries substantial risk of loss and is not suitable for every investor. Signals and bot output are informational only and are not financial advice."),
                InfoPageSection(heading: "3. Account Responsibility", body: "You are responsible for safeguarding your credentials and API keys. EmperialBot is not liable for losses arising from unauthorized account access."),
                InfoPageSection(heading: "4. Subscriptions", body: "Paid plans renew automatically until cancelled. You may manage or cancel your subscription at any time from your profile."),
                InfoPageSection(heading: "5. Limitation of Liability", body: "EmperialBot and its operators are not liable for any direct, indirect, or consequential damages resulting from use of the app or reliance on its data.")
            ]
        case .privacy:
            return [
                InfoPageSection(heading: "1. Information We Collect", body: "We collect account details you provide (email, display name) and usage analytics to improve the product. We do not sell your personal data."),
                InfoPageSection(heading: "2. API Keys & Credentials", body: "Broker API keys you enter are stored locally on your device and encrypted. They are never transmitted to our servers in plaintext."),
                InfoPageSection(heading: "3. How We Use Data", body: "Data is used to deliver signals, sync settings, process subscriptions, and provide support. We never share data with advertisers."),
                InfoPageSection(heading: "4. Your Rights", body: "You may request a copy of your data or deletion of your account at any time by contacting support."),
                InfoPageSection(heading: "5. Security", body: "We employ industry-standard encryption in transit and at rest. No method of transmission is 100% secure, but we work hard to protect your information.")
            ]
        case .about:
            return [
                InfoPageSection(heading: "Our Mission", body: "EmperialBot puts institutional-grade trading automation in your pocket — real-time signals, multi-broker connectivity, and arbitrage scanning across futures, options, and crypto."),
                InfoPageSection(heading: "What's Inside", body: "Live dashboard, advanced indicators, configurable trading and arbitrage bots, broker integrations for TradingView, NinjaTrader, Rithmic and Binance, plus a powerful alert engine."),
                InfoPageSection(heading: "Support", body: "Questions or feedback? Reach the team at support@emperialbot.app — we read every message."),
                InfoPageSection(heading: "Disclaimer", body: "EmperialBot is a tool, not a guarantee. All trading involves risk. Trade responsibly and never risk more than you can afford to lose.")
            ]
        }
    }
}
