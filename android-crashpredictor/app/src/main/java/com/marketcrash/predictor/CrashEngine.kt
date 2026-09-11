package com.marketcrash.predictor

import java.util.Locale
import kotlin.math.abs
import kotlin.math.absoluteValue
import kotlin.math.roundToInt

/**
 * Pure-logic crash assessor. Converts live cross-asset readings into weighted
 * stress signals and a single 0–100 Crash Index:
 *
 *  - Equity slide (S&P, Dow, Nasdaq, FTSE, Nikkei — worst daily move)
 *  - Fear gauge: the VIX level itself
 *  - Crypto rout (BTC / ETH 24 h)
 *  - Flight to gold (gold spiking while stocks fall)
 *  - Silver stress, oil shock (both directions)
 *  - Bond convulsion (10Y yield jerking) and 3m10y curve inversion
 *    (the Fed's preferred recession signal)
 *  - Safe-haven FX flight (CHF / JPY bid, i.e. USDCHF / USDJPY dropping hard)
 */
object CrashEngine {

    fun assess(quotes: List<MarketQuote>): CrashAssessment {
        val bySymbol = quotes.associateBy { it.symbol }
        val signals = mutableListOf<Signal>()

        fun add(name: String, severity: Int, weight: Double, detail: String) {
            signals.add(Signal(name, severity.coerceIn(0, 3), weight, detail))
        }

        // --- Equities: worst index move of the day --------------------------
        val equities = quotes.filter { it.assetClass == AssetClass.EQUITY }
        val worstEquity = equities.minByOrNull { it.changePct }
        if (worstEquity != null) {
            val c = worstEquity.changePct
            val sev = when {
                c <= -7.0 -> 3
                c <= -3.0 -> 2
                c <= -1.5 -> 1
                else -> 0
            }
            add("Equity slide", sev, 3.0, fmt("%s %+.2f%% today", worstEquity.name, c))
        }

        // --- Fear gauge: VIX absolute level -----------------------------------
        bySymbol["^vix"]?.let { vix ->
            val v = vix.price
            val sev = when {
                v >= 40.0 -> 3
                v >= 30.0 -> 2
                v >= 20.0 -> 1
                else -> 0
            }
            add("Fear gauge (VIX)", sev, 2.5, fmt("VIX at %.1f (%+.1f%%)", v, vix.changePct))
        }

        // --- Crypto rout ----------------------------------------------------
        val worstCrypto = quotes.filter { it.assetClass == AssetClass.CRYPTO }
            .minByOrNull { it.changePct }
        if (worstCrypto != null) {
            val c = worstCrypto.changePct
            val sev = when {
                c <= -20.0 -> 3
                c <= -10.0 -> 2
                c <= -5.0 -> 1
                else -> 0
            }
            add("Crypto rout", sev, 1.5, fmt("%s %+.2f%% / 24h", worstCrypto.name, c))
        }

        // --- Flight to gold ---------------------------------------------------
        bySymbol["gc=f"]?.let { gold ->
            val c = gold.changePct
            val sev = when {
                c >= 4.0 -> 3
                c >= 2.0 -> 2
                c >= 1.0 -> 1
                else -> 0
            }
            add("Flight to gold", sev, 2.0, fmt("Gold %+.2f%% today", c))
        }

        // --- Silver stress ----------------------------------------------------
        bySymbol["si=f"]?.let { silver ->
            val sev = when {
                abs(silver.changePct) >= 6.0 -> 2
                abs(silver.changePct) >= 3.0 -> 1
                else -> 0
            }
            add("Silver stress", sev, 1.0, fmt("Silver %+.2f%% today", silver.changePct))
        }

        // --- Oil shock (crash = demand collapse, spike = supply panic) -------
        bySymbol["cl=f"]?.let { oil ->
            val c = oil.changePct
            val sev = when {
                abs(c) >= 10.0 -> 3
                abs(c) >= 6.0 -> 2
                abs(c) >= 3.0 -> 1
                else -> 0
            }
            add("Oil shock", sev, 1.5, fmt("WTI crude %+.2f%% today", c))
        }

        // --- Bond convulsion: 10Y yield jerking hard --------------------------
        bySymbol["^tnx"]?.let { tenYq ->
            val movePct = tenYq.changePct.absoluteValue
            val sev = when {
                movePct >= 7.0 -> 3
                movePct >= 4.0 -> 2
                movePct >= 2.0 -> 1
                else -> 0
            }
            add(
                "Bond convulsion", sev, 2.0,
                fmt("US 10Y at %.2f%% (%+.2f%% move)", tenYq.price, tenYq.changePct)
            )
        }

        // --- Yield-curve inversion: 3M above 10Y = recession klaxon ----------
        val threeM = bySymbol["^irx"]
        val tenY = bySymbol["^tnx"]
        if (threeM != null && tenY != null) {
            val spread = tenY.price - threeM.price
            val sev = when {
                spread <= -0.5 -> 3
                spread <= -0.2 -> 2
                spread < 0.0 -> 1
                else -> 0
            }
            add("Curve inversion", sev, 2.5, fmt("3m10y spread %+.2f pts", spread))
        }

        // --- Safe-haven FX flight: CHF / JPY strengthening hard --------------
        val chf = bySymbol["chf=x"]
        val jpy = bySymbol["jpy=x"]
        val havenMove = listOfNotNull(chf?.changePct, jpy?.changePct).minOrNull()
        if (havenMove != null) {
            val sev = when {
                havenMove <= -3.0 -> 3
                havenMove <= -1.5 -> 2
                havenMove <= -0.7 -> 1
                else -> 0
            }
            add("Safe-haven FX flight", sev, 1.5, fmt("Strongest haven bid %+.2f%% vs USD", havenMove))
        }

        val score = compositeScore(signals)
        return CrashAssessment(score, CrashAssessment.levelFor(score), signals)
    }

    /**
     * Weighted severity, normalised to 0–100.
     * A market where every tracked signal is at severity 3 scores 100.
     */
    fun compositeScore(signals: List<Signal>): Int {
        if (signals.isEmpty()) return 0
        val earned = signals.sumOf { it.severity * it.weight }
        val possible = signals.sumOf { 3.0 * it.weight }
        return ((earned / possible) * 100.0).roundToInt().coerceIn(0, 100)
    }

    private fun fmt(pattern: String, vararg args: Any?) = String.format(Locale.US, pattern, *args)
}
