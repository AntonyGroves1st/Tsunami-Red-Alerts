import SwiftUI

struct LoginView: View {
    let vm: AppViewModel
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var showPassword: Bool = false
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                header
                if !errorMessage.isEmpty {
                    errorBanner
                }
                inputFields
                forgotPasswordLink
                loginButton
                divider
                signUpLink
                plansHint
            }
            .padding(.horizontal, 24)
            .padding(.top, 32)
            .padding(.bottom, 40)
        }
        .background(AppTheme.bg0)
    }

    private var header: some View {
        VStack(spacing: 24) {
            HStack(spacing: 10) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(AppTheme.amber)
                    .frame(width: 40, height: 40)
                    .overlay {
                        Text("E")
                            .font(.system(size: 20, weight: .black))
                            .foregroundStyle(AppTheme.bg0)
                    }
                (Text("Emperial").foregroundStyle(.white) + Text("Bot").foregroundStyle(AppTheme.amber))
                    .font(.system(size: 22, weight: .heavy))
            }
            VStack(spacing: 6) {
                Text("Welcome Back")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(.white)
                    .tracking(-0.5)
                Text("Log in to access your trading dashboard")
                    .font(.system(size: 15))
                    .foregroundStyle(AppTheme.text2)
                    .tracking(0.2)
            }
        }
        .padding(.bottom, 8)
    }

    private var errorBanner: some View {
        Text(errorMessage)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(AppTheme.red)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(AppTheme.red.opacity(0.08))
                    .strokeBorder(AppTheme.red.opacity(0.3), lineWidth: 1)
            )
    }

    private var inputFields: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "envelope")
                    .font(.system(size: 18))
                    .foregroundStyle(AppTheme.text3)
                TextField("Email Address", text: $email)
                    .font(.system(size: 15))
                    .foregroundStyle(.white)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .autocorrectionDisabled()
            }
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border2, lineWidth: 1)
            )

            HStack(spacing: 12) {
                Image(systemName: "lock")
                    .font(.system(size: 18))
                    .foregroundStyle(AppTheme.text3)
                Group {
                    if showPassword {
                        TextField("Password", text: $password)
                    } else {
                        SecureField("Password", text: $password)
                    }
                }
                .font(.system(size: 15))
                .foregroundStyle(.white)
                .autocorrectionDisabled()
                Button {
                    showPassword.toggle()
                } label: {
                    Image(systemName: showPassword ? "eye.slash" : "eye")
                        .font(.system(size: 18))
                        .foregroundStyle(AppTheme.text3)
                }
            }
            .padding(.horizontal, 16)
            .frame(height: 52)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(AppTheme.bg2)
                    .strokeBorder(AppTheme.border2, lineWidth: 1)
            )
        }
    }

    private var forgotPasswordLink: some View {
        HStack {
            Spacer()
            Button {
            } label: {
                Text("Forgot Password?")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(AppTheme.amber)
            }
        }
        .padding(.top, -8)
    }

    private var loginButton: some View {
        Button {
            isSubmitting = true
            errorMessage = ""
            _ = vm.login(email: email, password: password)
            isSubmitting = false
        } label: {
            HStack(spacing: 10) {
                if isSubmitting {
                    ProgressView()
                        .tint(AppTheme.bg0)
                } else {
                    Text("Log In")
                        .font(.system(size: 16, weight: .bold))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 18))
                }
            }
            .foregroundStyle(AppTheme.bg0)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(AppTheme.amber, in: RoundedRectangle(cornerRadius: 14))
        }
        .disabled(isSubmitting)
        .opacity(isSubmitting ? 0.7 : 1)
    }

    private var divider: some View {
        HStack(spacing: 12) {
            Rectangle().fill(AppTheme.border2).frame(height: 1)
            Text("or")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.text3)
            Rectangle().fill(AppTheme.border2).frame(height: 1)
        }
    }

    private var signUpLink: some View {
        Button {
        } label: {
            (Text("Don't have an account? ").foregroundStyle(AppTheme.text2) + Text("Sign Up").foregroundStyle(AppTheme.amber).font(.system(size: 14, weight: .bold)))
                .font(.system(size: 14))
        }
        .padding(.vertical, 10)
    }

    private var plansHint: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 8) {
                Image(systemName: "crown.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(AppTheme.amber)
                Text("Subscriber Plans")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(AppTheme.amber)
            }
            Text("After logging in, upgrade from your Profile to unlock all features.")
                .font(.system(size: 12))
                .foregroundStyle(AppTheme.text2)
                .padding(.bottom, 4)

            VStack(spacing: 8) {
                planMiniRow(icon: "bolt.fill", name: "Starter", price: "$89/mo", color: AppTheme.blue)
                planMiniRow(icon: "arrow.up.right", name: "Pro", price: "$180/mo", color: AppTheme.amber)
                planMiniRow(icon: "crown.fill", name: "Premium", price: "$350/mo", color: AppTheme.gold)
                planMiniRow(icon: "diamond.fill", name: "Elite", price: "$450/mo", color: AppTheme.purple)
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(AppTheme.bg2)
                .strokeBorder(AppTheme.border2, lineWidth: 1)
        )
        .padding(.top, 16)
    }

    private func planMiniRow(icon: String, name: String, price: String, color: Color) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(color)
            Text(name)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(AppTheme.text1)
            Spacer()
            Text(price)
                .font(.system(size: 13, weight: .heavy))
                .foregroundStyle(color)
        }
    }
}
