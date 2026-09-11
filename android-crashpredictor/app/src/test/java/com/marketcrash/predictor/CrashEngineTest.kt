package com.marketcrash.predictor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CrashEngineTest {

    private fun quote(
        symbol: String, name: String, cls: AssetClass, price: Double, change: Double
    ) = MarketQuote(symbol, name, cls, price, change)

    private fun calmMarket() = listOf(
        quote("^gspc", "S&P 500", AssetClass.EQUITY, 7650.0, 0.2),
        quote("^dji", "Dow Jones", AssetClass.EQUITY, 47000.0, 0.1),
        quote("^vix", "VIX", AssetClass.VOLATILITY, 14.5, -2.0),
        quote("bitcoin", "Bitcoin", AssetClass.CRYPTO, 97000.0, 0.5),
        quote("gc=f", "Gold", AssetClass.METAL, 4390.0, 0.1),
        quote("si=f", "Silver", AssetClass.METAL, 65.0, 0.2),
        quote("cl=f", "WTI Crude", AssetClass.ENERGY, 99.0, 0.3),
        quote("^tnx", "US 10Y", AssetClass.BOND, 4.9, 0.1),
        quote("^irx", "US 3M", AssetClass.BOND, 3.9, 0.1),
        quote("chf=x", "USD/CHF", AssetClass.FX, 0.81, 0.0),
        quote("jpy=x", "USD/JPY", AssetClass.FX, 153.0, 0.1)
    )

    private fun panicMarket() = listOf(
        quote("^gspc", "S&P 500", AssetClass.EQUITY, 7000.0, -8.2),
        quote("^dji", "Dow Jones", AssetClass.EQUITY, 43000.0, -7.4),
        quote("^vix", "VIX", AssetClass.VOLATILITY, 55.0, 120.0),
        quote("bitcoin", "Bitcoin", AssetClass.CRYPTO, 61000.0, -24.0),
        quote("gc=f", "Gold", AssetClass.METAL, 4600.0, 4.8),
        quote("si=f", "Silver", AssetClass.METAL, 70.0, 7.2),
        quote("cl=f", "WTI Crude", AssetClass.ENERGY, 82.0, -12.5),
        quote("^tnx", "US 10Y", AssetClass.BOND, 3.6, -8.0),
        quote("^irx", "US 3M", AssetClass.BOND, 4.3, 2.0),
        quote("chf=x", "USD/CHF", AssetClass.FX, 0.77, -3.4),
        quote("jpy=x", "USD/JPY", AssetClass.FX, 144.0, -3.1)
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
    fun vixSignalTracksFearLevels() {
        val calm = CrashEngine.assess(calmMarket())
        assertEquals(0, calm.signals.first { it.name == "Fear gauge (VIX)" }.severity)
        val panic = CrashEngine.assess(panicMarket())
        assertEquals(3, panic.signals.first { it.name == "Fear gauge (VIX)" }.severity)
    }

    @Test
    fun inversionSignalFiresWhenThreeMonthAboveTenYear() {
        val a = CrashEngine.assess(panicMarket())
        val inversion = a.signals.first { it.name == "Curve inversion" }
        assertEquals(3, inversion.severity) // spread 3.6 - 4.3 = -0.7
    }

    @Test
    fun goldFlightOnlyFiresOnSpikesUp() {
        val falling = calmMarket().map {
            if (it.symbol == "gc=f") it.copy(changePct = -3.0) else it
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
