# Market Crash Predictor (Android)

**Crash Oracle** — a native Android systemic-risk sentinel with a midnight-navy, gilded "private bank" dashboard. It sweeps live cross-asset market feeds, distils them into a single **Crash Index (0–100)**, and lights up — full-screen flashing alarm, vibration siren, high-priority notification — when the world looks like it is about to fold.

## What it tracks

| Layer | Coverage | Source |
| --- | --- | --- |
| Equities | S&P 500, Dow Jones, Nasdaq, FTSE 100, Nikkei 225 | Yahoo Finance chart API (key-less) |
| Volatility | VIX fear index | Yahoo Finance |
| Bonds | US 10Y & 3M yields, 3m10y curve inversion (the Fed's preferred recession signal) | Yahoo Finance |
| Metals | Gold, Silver | Yahoo Finance |
| Energy | WTI crude | Yahoo Finance |
| Currencies | EUR/USD, USD/JPY, USD/CHF safe-haven flight | Yahoo Finance |
| Crypto | Bitcoin, Ethereum 24 h | CoinGecko free API |

Each sweep scores nine weighted stress signals — equity slide, VIX fear gauge, crypto rout, flight to gold, silver stress, oil shock, bond convulsion, curve inversion, safe-haven FX flight — into the Crash Index. Levels: **SERENE → EARLY-BIRD WATCH → STRESS WARNING → GLOBAL CRASH ALERT** (index 75+).

> v1.1: switched market data from Stooq (which retired its CSV quote endpoint behind an anti-bot wall, breaking v1.0) to Yahoo Finance's key-less chart API, and added the VIX signal.

## The sentinel layer (the fun part)

- **Elite watch** — the top 50 richest men and women (public Forbes-style list) on a live "fortunes in motion" board.
- **Bunker trigger** — a New Zealand inbound pressure index over 12 long-haul and private-jet corridors (LAX→AKL, TEB→ZQN…). Sustained readings above 70 mean the wealthy are running.
- **World leaders** — 24 leader offices (G20 heads, Fed, ECB, BoE, UN) on an early-bird posture board.

**Honesty note:** these boards are *heuristic indicators derived deterministically from the live Crash Index* (salted per entity, per day). No real people, jets, or ticket purchases are tracked — public flight/ticket surveillance APIs do not exist. The boards are an early-warning metaphor that animates with genuine market stress. The in-app disclaimer says the same.

## The dashboard

- Hand-drawn **Crash Index dial** (270° sweep-gradient gauge, gilded needle) inside a gold-trimmed card.
- **Market pulse grid**: per-asset cards with price, direction-coloured change chip, and an in-session **sparkline**.
- Stress-signal board with severity-coloured bullets, elite/bunker/leader cards, champagne-serif wordmark, letter-spaced overlines, glass cards on a midnight gradient.
- **Start 24/7 sentinel** — a foreground service polls every 5 minutes and fires alerts in the background. **Test crash alert** runs a full drill.

## Building the APK

Requires JDK 17+ and the Android SDK (compileSdk 34).

```bash
cd android-crashpredictor
./gradlew assembleRelease   # or assembleDebug
```

APK output: `app/build/outputs/apk/release/app-release.apk`. If `android-crashpredictor/release.keystore` is absent, generate one first:

```bash
keytool -genkeypair -keystore release.keystore -alias crashpredictor -keyalg RSA \
  -keysize 2048 -validity 10000 -storepass oracle -keypass oracle \
  -dname "CN=Market Crash Predictor"
```

## Disclaimer

This is an entertainment and market-curiosity tool, not financial advice, not an investment signal, and not a surveillance system. Data comes from free public feeds that can lag or fail; the app degrades gracefully and says so on screen.
