import SwiftUI

struct BrokersView: View {
    @Bindable var vm: AppViewModel
    @State private var selectedBroker: BrokerConfig?
    @State private var showConfig: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerSection
                infoCard
                arbitrageCard

                sectionLabel("TRADING PLATFORMS")
                ForEach(vm.brokers.filter { ["tradingview", "ninjatrader", "rprotrader", "binance"].contains($0.id) }) { broker in
                    brokerCard(broker)
                }

                sectionLabel("NOTIFICATION CHANNELS")
                ForEach(vm.brokers.filter { ["discord", "telegram"].contains($0.id) }) { broker in
                    brokerCard(broker)
                }

                webhookSection
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 32)
        }
        .background(AppTheme.bg0)
        .sheet(isPresented: $showConfig) {
            if let broker = selectedBroker {
                BrokerConfigSheet(broker: broker, vm: vm, isPresented: $showConfig)
            }
        }
    }

    private var headerSection: some View {
        HStack {
            Text("Broker")
                .font(.title2)
                .fontWeight(.heavy)
                .foregroundStyle(.white)
            + Text("Connect")
                .font(.title2)
                .fontWeight(.heavy)
                .foregroundStyle(AppTheme.cyan)
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: "link")
                    .font(.system(size: 11))
                Text("\(vm.connectedBrokersCount) linked")
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(vm.connectedBrokersCount > 0 ? AppTheme.green : AppTheme.text2)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
        .padding(.top, 8)
    }

    private var infoCard: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(AppTheme.cyan)
                .font(.system(size: 14))
            VStack(alignment: .leading, spacing: 4) {
                Text("How Broker Integration Works")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.cyan)
                Text("Connect your brokers to receive signals and execute trades automatically. Webhook-based brokers receive POST requests when signals fire.")
                    .font(.system(size: 11))
                    .foregroundStyle(AppTheme.text2)
                    .lineSpacing(3)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(AppTheme.cyan.opacity(0.05))
                .strokeBorder(AppTheme.cyan.opacity(0.12), lineWidth: 1)
        )
    }

    private var arbitrageCard: some View {
        VStack(spacing: 10) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.amber.opacity(0.12))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: "arrow.left.arrow.right")
                            .foregroundStyle(AppTheme.amber)
                    )
                VStack(alignment: .leading, spacing: 2) {
                    Text("Arbitrage Scanner")
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(AppTheme.amber)
                    Text("Find price differences across connected platforms")
                        .font(.system(size: 10))
                        .foregroundStyle(AppTheme.text2)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.amber)
            }
            HStack(spacing: 5) {
                ForEach(["Cross-Exchange", "Spot vs Futures", "Live Prices"], id: \.self) { tag in
                    Text(tag)
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundStyle(AppTheme.amber)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(AppTheme.amber.opacity(0.1))
                        .clipShape(.rect(cornerRadius: 4))
                }
                Spacer()
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.amber.opacity(0.05))
                .strokeBorder(AppTheme.amber.opacity(0.15), lineWidth: 1)
        )
    }

    private func sectionLabel(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(AppTheme.text2)
                .tracking(1)
            Spacer()
        }
    }

    private func brokerCard(_ broker: BrokerConfig) -> some View {
        Button {
            selectedBroker = broker
            showConfig = true
        } label: {
            VStack(spacing: 10) {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(hex: broker.color).opacity(0.12))
                        .frame(width: 44, height: 44)
                        .overlay(
                            Text(broker.logo)
                                .font(.system(size: 16, weight: .heavy))
                                .foregroundStyle(Color(hex: broker.color))
                        )
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(broker.name)
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(AppTheme.text1)
                            Circle()
                                .fill(broker.isConnected ? AppTheme.green : AppTheme.text3)
                                .frame(width: 7, height: 7)
                        }
                        Text(broker.description)
                            .font(.system(size: 10))
                            .foregroundStyle(AppTheme.text2)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.text3)
                }

                HStack(spacing: 5) {
                    ForEach(broker.supportedFeatures.prefix(3), id: \.self) { feat in
                        Text(feat)
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(AppTheme.text2)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.white.opacity(0.04))
                            .clipShape(.rect(cornerRadius: 4))
                    }
                    Spacer()
                }

                if broker.isConnected {
                    Divider().background(AppTheme.border)
                    HStack(spacing: 5) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(AppTheme.green)
                        Text("Connected")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.green)
                        Spacer()
                        Button {
                            vm.toggleBrokerConnection(broker.id)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "link.badge.plus")
                                    .font(.system(size: 10))
                                Text("Disconnect")
                                    .font(.system(size: 10, weight: .semibold))
                            }
                            .foregroundStyle(AppTheme.red)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(AppTheme.red.opacity(0.08))
                                    .strokeBorder(AppTheme.red.opacity(0.15), lineWidth: 1)
                            )
                        }
                    }
                }
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.bg1)
                    .strokeBorder(broker.isConnected ? Color(hex: broker.color).opacity(0.2) : AppTheme.border, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private var webhookSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "server.rack")
                    .font(.system(size: 13))
                    .foregroundStyle(AppTheme.cyan)
                Text("YOUR WEBHOOK ENDPOINT")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(AppTheme.cyan)
                    .tracking(1)
            }
            Text("Use this URL in your broker's webhook settings to receive signals in this app.")
                .font(.system(size: 11))
                .foregroundStyle(AppTheme.text2)
                .lineSpacing(3)

            HStack {
                Text("https://your-app.com/api/webhook/<broker_id>")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(AppTheme.text1)
                    .lineLimit(1)
                Spacer()
                Button {
                    UIPasteboard.general.string = "https://your-app.com/api/webhook/"
                } label: {
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 14))
                        .foregroundStyle(AppTheme.cyan)
                }
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.cyan.opacity(0.12), lineWidth: 1)
        )
    }
}

struct BrokerConfigSheet: View {
    let broker: BrokerConfig
    let vm: AppViewModel
    @Binding var isPresented: Bool
    @State private var apiKey: String = ""
    @State private var apiSecret: String = ""
    @State private var webhookUrl: String = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 12) {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color(hex: broker.color).opacity(0.12))
                            .frame(width: 48, height: 48)
                            .overlay(
                                Text(broker.logo)
                                    .font(.system(size: 18, weight: .heavy))
                                    .foregroundStyle(Color(hex: broker.color))
                            )
                        VStack(alignment: .leading) {
                            Text(broker.name)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(AppTheme.text1)
                            Text(broker.isConnected ? "Connected" : "Configure Integration")
                                .font(.system(size: 12))
                                .foregroundStyle(AppTheme.text2)
                        }
                    }

                    if ["binance", "ninjatrader"].contains(broker.id) {
                        fieldSection(label: "API KEY", icon: "key.fill", text: $apiKey, placeholder: "Enter your API key", secure: true)
                        fieldSection(label: "API SECRET", icon: "shield.fill", text: $apiSecret, placeholder: "Enter your API secret", secure: true)
                    }

                    if ["tradingview", "rprotrader", "discord", "telegram"].contains(broker.id) {
                        fieldSection(label: "WEBHOOK URL", icon: "globe", text: $webhookUrl, placeholder: "https://...", secure: false)
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("SUPPORTED FEATURES")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(AppTheme.text2)
                            .tracking(0.5)
                        ForEach(broker.supportedFeatures, id: \.self) { feat in
                            HStack(spacing: 6) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 10))
                                    .foregroundStyle(AppTheme.green)
                                Text(feat)
                                    .font(.system(size: 12))
                                    .foregroundStyle(AppTheme.text1)
                            }
                        }
                    }

                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(AppTheme.amber)
                        Text("API keys are stored locally on your device. Never share your API keys or secrets with anyone.")
                            .font(.system(size: 10))
                            .foregroundStyle(AppTheme.text2)
                            .lineSpacing(3)
                    }
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(AppTheme.amber.opacity(0.05))
                            .strokeBorder(AppTheme.amber.opacity(0.12), lineWidth: 1)
                    )

                    HStack(spacing: 10) {
                        Button {
                            isPresented = false
                        } label: {
                            Text("Cancel")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(AppTheme.text2)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 10)
                                        .fill(AppTheme.bg3)
                                )
                        }

                        Button {
                            vm.toggleBrokerConnection(broker.id)
                            isPresented = false
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "link")
                                    .font(.system(size: 14))
                                Text(broker.isConnected ? "Update" : "Connect")
                                    .font(.system(size: 14, weight: .bold))
                            }
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(Color(hex: broker.color))
                            )
                        }
                    }
                }
                .padding(20)
            }
            .background(AppTheme.bg1)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.large])
    }

    private func fieldSection(label: String, icon: String, text: Binding<String>, placeholder: String, secure: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(AppTheme.text2)
                .tracking(0.5)
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14))
                    .foregroundStyle(AppTheme.text2)
                if secure {
                    SecureField(placeholder, text: text)
                        .foregroundStyle(AppTheme.text1)
                        .font(.system(size: 14))
                } else {
                    TextField(placeholder, text: text)
                        .foregroundStyle(AppTheme.text1)
                        .font(.system(size: 14))
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }
            }
            .padding(10)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border, lineWidth: 1)
            )
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
