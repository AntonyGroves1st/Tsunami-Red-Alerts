package com.marketcrash.predictor

/** Overall systemic-risk level, ordered from serene to catastrophic. */
enum class CrashLevel(val label: String) {
    SERENE("MARKETS SERENE"),
    WATCH("EARLY-BIRD WATCH"),
    WARNING("STRESS WARNING"),
    CRASH("GLOBAL CRASH ALERT")
}

/** Asset classes tracked on the dashboard. */
enum class AssetClass(val label: String) {
    EQUITY("Equities"),
    BOND("Bonds"),
    METAL("Metals"),
    ENERGY("Energy"),
    CRYPTO("Crypto"),
    FX("Currencies")
}

/** A single live market reading. */
data class MarketQuote(
    val symbol: String,
    val name: String,
    val assetClass: AssetClass,
    val price: Double,
    val changePct: Double
)

/** One scored stress signal feeding the composite crash index. */
data class Signal(
    val name: String,
    /** 0 calm · 1 elevated · 2 high · 3 extreme */
    val severity: Int,
    /** Relative weight of this signal in the composite index. */
    val weight: Double,
    val detail: String
)

/** Composite output of the engine: 0–100 index, level, and its drivers. */
data class CrashAssessment(
    val score: Int,
    val level: CrashLevel,
    val signals: List<Signal>
) {
    companion object {
        fun levelFor(score: Int): CrashLevel = when {
            score >= 75 -> CrashLevel.CRASH
            score >= 50 -> CrashLevel.WARNING
            score >= 25 -> CrashLevel.WATCH
            else -> CrashLevel.SERENE
        }
    }
}

/** One of the 50 wealthiest people on the sentinel watchlist. */
data class Billionaire(val name: String, val country: String, val source: String)

/** A head of state / government office on the sentinel watchlist. */
data class Leader(val name: String, val role: String, val country: String)

/** A monitored long-haul route into New Zealand (the "bunker trigger"). */
data class NzRoute(val from: String, val fromCode: String, val toCode: String)

/** Sentinel entity status derived from market stress (heuristic, not surveillance). */
data class SentinelStatus(
    val entity: String,
    val detail: String,
    /** 0 quiet · 1 murmurs · 2 unusual · 3 bunker-bound */
    val agitation: Int
)
