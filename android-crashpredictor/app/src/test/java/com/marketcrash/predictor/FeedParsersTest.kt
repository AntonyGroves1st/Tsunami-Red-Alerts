package com.marketcrash.predictor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedParsersTest {

    private val stooqCsv = """
        Symbol,Date,Time,Open,High,Low,Close,Volume
        ^SPX,2026-09-11,22:00:00,6500.00,6550.00,6400.00,6435.00,0
        XAUUSD,2026-09-11,22:00:00,2400.00,2460.00,2395.00,2448.00,0
        10USY.B,2026-09-11,22:00:00,4.20,4.35,4.18,4.33,0
        2USY.B,2026-09-11,22:00:00,4.60,4.62,4.50,4.55,0
        BADSYM,2026-09-11,22:00:00,1.00,1.00,1.00,1.00,0
        USDJPY,2026-09-11,22:00:00,N/D,N/D,N/D,N/D,0
    """.trimIndent()

    @Test
    fun parsesKnownStooqSymbolsAndComputesChange() {
        val quotes = FeedParsers.parseStooqCsv(stooqCsv)
        assertEquals(4, quotes.size)

        val spx = quotes.first { it.symbol == "^spx" }
        assertEquals("S&P 500", spx.name)
        assertEquals(AssetClass.EQUITY, spx.assetClass)
        assertEquals(6435.00, spx.price, 0.001)
        assertEquals(-1.0, spx.changePct, 0.001)

        val gold = quotes.first { it.symbol == "xauusd" }
        assertEquals(AssetClass.METAL, gold.assetClass)
        assertEquals(2.0, gold.changePct, 0.001)
    }

    @Test
    fun skipsUnknownSymbolsAndNoDataRows() {
        val quotes = FeedParsers.parseStooqCsv(stooqCsv)
        assertTrue(quotes.none { it.symbol == "badsym" })
        assertTrue(quotes.none { it.symbol == "usdjpy" })
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
