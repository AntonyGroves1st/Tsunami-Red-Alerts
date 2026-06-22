import SwiftUI

struct AdminPanelView: View {
    @Bindable var vm: AppViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var maintenanceMode: Bool = false
    @State private var killSwitch: Bool = false
    @State private var allowSignups: Bool = true
    @State private var broadcastMessage: String = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    statsGrid
                    systemControlsSection
                    userManagementSection
                    broadcastSection
                    dangerZoneSection
                }
                .padding(16)
                .padding(.bottom, 40)
            }
            .background(AppTheme.bg0)
            .navigationTitle("Admin Control")
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

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            statCard(icon: "person.2.fill", value: "1,284", label: "Total Users", color: AppTheme.blue)
            statCard(icon: "crown.fill", value: "342", label: "Active Members", color: AppTheme.gold)
            statCard(icon: "antenna.radiowaves.left.and.right", value: "\(vm.signals.count)", label: "Live Signals", color: AppTheme.green)
            statCard(icon: "dollarsign.circle.fill", value: "$48.2K", label: "MRR", color: AppTheme.amber)
        }
    }

    private func statCard(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(color)
            Text(value)
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(.white)
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(AppTheme.text2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(color.opacity(0.18), lineWidth: 1)
        )
    }

    private var systemControlsSection: some View {
        sectionCard(title: "SYSTEM CONTROLS", icon: "gearshape.2.fill", accent: AppTheme.cyan) {
            toggleRow(icon: "wrench.and.screwdriver.fill", label: "Maintenance Mode", subtitle: "Take the app offline for all users", isOn: $maintenanceMode, color: AppTheme.amber)
            Divider().background(AppTheme.border)
            toggleRow(icon: "person.badge.plus", label: "Allow New Signups", subtitle: "Permit new account registration", isOn: $allowSignups, color: AppTheme.green)
            Divider().background(AppTheme.border)
            toggleRow(icon: "bolt.slash.fill", label: "Global Kill Switch", subtitle: "Stop all bot trading instantly", isOn: $killSwitch, color: AppTheme.red)
        }
    }

    private var userManagementSection: some View {
        sectionCard(title: "USER MANAGEMENT", icon: "person.2.badge.gearshape.fill", accent: AppTheme.blue) {
            ForEach(mockUsers) { u in
                HStack(spacing: 12) {
                    Circle()
                        .fill(AppTheme.bg3)
                        .frame(width: 38, height: 38)
                        .overlay {
                            Text(u.initials)
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(AppTheme.amber)
                        }
                    VStack(alignment: .leading, spacing: 2) {
                        Text(u.name)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white)
                        Text(u.email)
                            .font(.system(size: 11))
                            .foregroundStyle(AppTheme.text2)
                    }
                    Spacer()
                    Text(u.plan)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(u.plan == "Free" ? AppTheme.text2 : AppTheme.gold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            Capsule().fill((u.plan == "Free" ? AppTheme.text2 : AppTheme.gold).opacity(0.12))
                        )
                }
                .padding(.vertical, 6)
                if u.id != mockUsers.last?.id {
                    Divider().background(AppTheme.border)
                }
            }
        }
    }

    private var broadcastSection: some View {
        sectionCard(title: "BROADCAST MESSAGE", icon: "megaphone.fill", accent: AppTheme.purple) {
            Text("Send a push notification to all active users.")
                .font(.system(size: 11))
                .foregroundStyle(AppTheme.text2)
            TextField("Type your announcement…", text: $broadcastMessage, axis: .vertical)
                .lineLimit(3, reservesSpace: true)
                .font(.system(size: 13))
                .foregroundStyle(.white)
                .padding(10)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(AppTheme.bg2)
                        .strokeBorder(AppTheme.border, lineWidth: 1)
                )
            Button {
                broadcastMessage = ""
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "paperplane.fill")
                    Text("Send Broadcast")
                        .fontWeight(.bold)
                }
                .font(.system(size: 14))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(broadcastMessage.isEmpty ? AppTheme.bg3 : AppTheme.purple)
                )
            }
            .disabled(broadcastMessage.isEmpty)
        }
    }

    private var dangerZoneSection: some View {
        sectionCard(title: "DANGER ZONE", icon: "exclamationmark.octagon.fill", accent: AppTheme.red) {
            adminActionRow(icon: "arrow.counterclockwise", label: "Flush Signal Cache", color: AppTheme.amber)
            Divider().background(AppTheme.border)
            adminActionRow(icon: "trash.fill", label: "Clear All Logs", color: AppTheme.red)
        }
    }

    private func adminActionRow(icon: String, label: String, color: Color) -> some View {
        Button {
        } label: {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(color)
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(AppTheme.text3)
            }
            .padding(.vertical, 8)
        }
    }

    private func toggleRow(icon: String, label: String, subtitle: String, isOn: Binding<Bool>, color: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundStyle(color)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundStyle(AppTheme.text2)
            }
            Spacer()
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(color)
        }
        .padding(.vertical, 6)
    }

    private func sectionCard<Content: View>(title: String, icon: String, accent: Color, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 12))
                    .foregroundStyle(accent)
                Text(title)
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(accent)
                    .tracking(1)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg1)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
    }

    private struct AdminUser: Identifiable {
        let id: String
        let name: String
        let email: String
        let initials: String
        let plan: String
    }

    private let mockUsers: [AdminUser] = [
        AdminUser(id: "1", name: "Marcus Webb", email: "marcus@trade.io", initials: "MW", plan: "Elite"),
        AdminUser(id: "2", name: "Sara Chen", email: "sara.c@gmail.com", initials: "SC", plan: "Pro"),
        AdminUser(id: "3", name: "Devon Hart", email: "dhart@outlook.com", initials: "DH", plan: "Free"),
        AdminUser(id: "4", name: "Priya Nair", email: "priya@fund.co", initials: "PN", plan: "Premium")
    ]
}
