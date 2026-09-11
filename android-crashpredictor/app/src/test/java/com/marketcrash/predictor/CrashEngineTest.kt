package com.marketcrash.predictor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CrashEngineTest {

    private fun quote(
        symbol: String, name: String, cls: AssetClass, price: Double, change: Double
    ) = MarketQuote(symbol, name, cls, price, change)

    private fun calmMarket() = listOf(
        quote("^spx", "S&P 500", AssetClass.EQUITY, 6500.0, 0.2),
        quote("^dji", "Dow Jones", AssetClass.EQUITY, 45000.0, 0.1),
        quote("bitcoin", "Bitcoin", AssetClass.CRYPTO, 97000.0, 0.5),
        quote("xauusd", "Gold", AssetClass.METAL, 2400.0, 0.1),
        quote("xagusd", "Silver", AssetClass.METAL, 29.0, 0.2),
        quote("cl.f", "WTI Crude", AssetClass.ENERGY, 78.0, 0.3),
        quote("10usy.b", "US 10Y", AssetClass.BOND, 4.2, 0.1),
        quote("2usy.b", "US 2Y", AssetClass.BOND, 4.0, 0.1),
        quote("usdchf", "USD/CHF", AssetClass.FX, 0.88, 0.0),
        quote("usdjpy", "USD/JPY", AssetClass.FX, 148.0, 0.1)
    )

    private fun panicMarket() = listOf(
        quote("^spx", "S&P 500", AssetClass.EQUITY, 5850.0, -8.2),
        quote("^dji", "Dow Jones", AssetClass.EQUITY, 40100.0, -7.4),
        quote("bitcoin", "Bitcoin", AssetClass.CRYPTO, 61000.0, -24.0),
        quote("xauusd", "Gold", AssetClass.METAL, 2610.0, 4.8),
        quote("xagusd", "Silver", AssetClass.METAL, 31.5, 7.2),
        quote("cl.f", "WTI Crude", AssetClass.ENERGY, 61.0, -12.5),
        quote("10usy.b", "US 10Y", AssetClass.BOND, 3.6, -8.0),
        quote("2usy.b", "US 2Y", AssetClass.BOND, 4.3, 2.0),
        quote("usdchf", "USD/CHF", AssetClass.FX, 0.83, -3.4),
        quote("usdjpy", "USD/JPY", AssetClass.FX, 139.0, -3.1)
    )

    @Test
    fun calmMarketScoresSerene() {
        val a = CrashEngine.assess(calmMarket())
        assertTrue("expected low score, got ${a.score}", a.score < 25)
        assertEquals(CrashLevel.SERENE, a.level)
    }

    @Test
    fun panicMarketScoresCrash() {
        val a = CrashEngine.assess(panicMarket())
        assertTrue("expected crash score, got ${a.score}", a.score >= 75)
        assertEquals(CrashLevel.CRASH, a.level)
    }

    @Test
    fun inversionSignalFiresWhenTwoYearAboveTenYear() {
        val a = CrashEngine.assess(panicMarket())
        val inversion = a.signals.first { it.name == "Curve inversion" }
        assertEquals(3, inversion.severity) // spread 3.6 - 4.3 = -0.7
    }

    @Test
    fun goldFlightOnlyFiresOnSpikesUp() {
        val falling = calmMarket().map {
            if (it.symbol == "xauusd") it.copy(changePct = -3.0) else it
        }
        val a = CrashEngine.assess(falling)
        assertEquals(0, a.signals.first { it.name == "Flight to gold" }.severity)
    }

    @Test
    fun levelThresholdsMatchSpec() {
        assertEquals(CrashLevel.SERENE, CrashAssessment.levelFor(0))
        assertEquals(CrashLevel.SERENE, CrashAssessment.levelFor(24))
        assertEquals(CrashLevel.WATCH, CrashAssessment.levelFor(25))
        assertEquals(CrashLevel.WARNING, CrashAssessment.levelFor(50))
        assertEquals(CrashLevel.CRASH, CrashAssessment.levelFor(75))
        assertEquals(CrashLevel.CRASH, CrashAssessment.levelFor(100))
    }

    @Test
    fun compositeScoreBounds() {
        assertEquals(0, CrashEngine.compositeScore(emptyList()))
        val allMax = listOf(
            Signal("a", 3, 2.0, ""), Signal("b", 3, 1.0, "")
        )
        assertEquals(100, CrashEngine.compositeScore(allMax))
        val allZero = allMax.map { it.copy(severity = 0) }
        assertEquals(0, CrashEngine.compositeScore(allZero))
    }

    @Test
    fun missingFeedsDegradeGracefully() {
        val a = CrashEngine.assess(emptyList())
        assertEquals(0, a.score)
        assertEquals(CrashLevel.SERENE, a.level)
        assertTrue(a.signals.isEmpty())
    }
}
