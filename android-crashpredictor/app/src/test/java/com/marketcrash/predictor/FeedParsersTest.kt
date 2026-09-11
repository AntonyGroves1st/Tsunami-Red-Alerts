package com.marketcrash.predictor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedParsersTest {

    private fun yahooJson(price: Double, changePct: Double?, prevClose: Double? = null): String {
        val extra = buildString {
            changePct?.let { append(""","regularMarketChangePercent":$it""") }
            prevClose?.let { append(""","chartPreviousClose":$it""") }
        }
        return """{"chart":{"result":[{"meta":{"symbol":"X","regularMarketPrice":$price$extra}}],"error":null}}"""
    }

    @Test
    fun parsesYahooChartWithDirectChangePercent() {
        val q = FeedParsers.parseYahooChart(yahooJson(7656.98, 0.86), "^gspc")
        assertEquals("^gspc", q!!.symbol)
        assertEquals("S&P 500", q.name)
        assertEquals(AssetClass.EQUITY, q.assetClass)
        assertEquals(7656.98, q.price, 0.001)
        assertEquals(0.86, q.changePct, 0.001)
    }

    @Test
    fun fallsBackToPreviousCloseWhenChangeMissing() {
        val q = FeedParsers.parseYahooChart(yahooJson(102.0, null, prevClose = 100.0), "gc=f")
        assertEquals(AssetClass.METAL, q!!.assetClass)
        assertEquals(2.0, q.changePct, 0.001)
    }

    @Test
    fun rejectsUnknownSymbolsAndEmptyPayloads() {
        assertNull(FeedParsers.parseYahooChart(yahooJson(1.0, 1.0), "badsym"))
        assertNull(FeedParsers.parseYahooChart("""{"chart":{"result":[],"error":null}}""", "^gspc"))
        assertNull(
            FeedParsers.parseYahooChart(
                """{"chart":{"result":[{"meta":{"symbol":"^GSPC"}}],"error":null}}""", "^gspc"
            )
        )
    }

    @Test
    fun yahooSymbolTableCoversAllAssetClasses() {
        val classes = FeedParsers.YAHOO_SYMBOLS.values.map { it.second }.toSet()
        assertTrue(classes.contains(AssetClass.EQUITY))
        assertTrue(classes.contains(AssetClass.VOLATILITY))
        assertTrue(classes.contains(AssetClass.BOND))
        assertTrue(classes.contains(AssetClass.METAL))
        assertTrue(classes.contains(AssetClass.ENERGY))
        assertTrue(classes.contains(AssetClass.FX))
    }

    @Test
    fun parsesCoinGeckoPrices() {
        val json = """
            {"bitcoin":{"usd":97250.5,"usd_24h_change":-6.25},
             "ethereum":{"usd":3120.0,"usd_24h_change":2.1}}
        """.trimIndent()
        val quotes = FeedParsers.parseCoinGecko(json)
        assertEquals(2, quotes.size)
        val btc = quotes.first { it.symbol == "bitcoin" }
        assertEquals(AssetClass.CRYPTO, btc.assetClass)
        assertEquals(97250.5, btc.price, 0.001)
        assertEquals(-6.25, btc.changePct, 0.001)
    }

    @Test
    fun coinGeckoToleratesMissingChangeField() {
        val json = """{"bitcoin":{"usd":50000.0}}"""
        val quotes = FeedParsers.parseCoinGecko(json)
        assertEquals(1, quotes.size)
        assertEquals(0.0, quotes[0].changePct, 0.0)
    }
}
