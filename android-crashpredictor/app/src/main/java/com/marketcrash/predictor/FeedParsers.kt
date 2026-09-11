package com.marketcrash.predictor

import org.json.JSONObject

/**
 * Pure parsing functions for the free market feeds (unit-testable, no Android deps).
 *
 * Sources:
 *  - Stooq CSV quotes (indices, bonds, metals, energy, FX) — no API key needed.
 *  - CoinGecko simple-price JSON (crypto) — no API key needed.
 */
object FeedParsers {

    /** Static metadata for the Stooq symbols we poll. */
    val STOOQ_SYMBOLS: Map<String, Pair<String, AssetClass>> = mapOf(
        "^spx" to ("S&P 500" to AssetClass.EQUITY),
        "^dji" to ("Dow Jones" to AssetClass.EQUITY),
        "^ndq" to ("Nasdaq 100" to AssetClass.EQUITY),
        "^ukx" to ("FTSE 100" to AssetClass.EQUITY),
        "^nkx" to ("Nikkei 225" to AssetClass.EQUITY),
        "10usy.b" to ("US 10Y Yield" to AssetClass.BOND),
        "2usy.b" to ("US 2Y Yield" to AssetClass.BOND),
        "xauusd" to ("Gold" to AssetClass.METAL),
        "xagusd" to ("Silver" to AssetClass.METAL),
        "cl.f" to ("WTI Crude" to AssetClass.ENERGY),
        "eurusd" to ("EUR / USD" to AssetClass.FX),
        "usdjpy" to ("USD / JPY" to AssetClass.FX),
        "usdchf" to ("USD / CHF" to AssetClass.FX)
    )

    /**
     * Parses Stooq CSV in the `f=sd2t2ohlcv&h&e=csv` format:
     * `Symbol,Date,Time,Open,High,Low,Close,Volume` with one row per symbol.
     * Day change is computed open -> close. Rows with `N/D` data are skipped.
     */
    fun parseStooqCsv(csv: String): List<MarketQuote> {
        val quotes = mutableListOf<MarketQuote>()
        csv.lineSequence().drop(1).forEach { line ->
            val cols = line.trim().split(",")
            if (cols.size < 7) return@forEach
            val symbol = cols[0].lowercase()
            val meta = STOOQ_SYMBOLS[symbol] ?: return@forEach
            val open = cols[3].toDoubleOrNull() ?: return@forEach
            val close = cols[6].toDoubleOrNull() ?: return@forEach
            if (open <= 0.0) return@forEach
            val changePct = (close - open) / open * 100.0
            quotes.add(MarketQuote(symbol, meta.first, meta.second, close, changePct))
        }
        return quotes
    }

    /**
     * Parses CoinGecko `/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`:
     * `{"bitcoin":{"usd":97000.1,"usd_24h_change":-3.2}, ...}`
     */
    fun parseCoinGecko(json: String): List<MarketQuote> {
        val names = mapOf("bitcoin" to "Bitcoin", "ethereum" to "Ethereum")
        val root = JSONObject(json)
        val quotes = mutableListOf<MarketQuote>()
        for (id in names.keys) {
            val obj = root.optJSONObject(id) ?: continue
            val price = obj.optDouble("usd", Double.NaN)
            val change = obj.optDouble("usd_24h_change", Double.NaN)
            if (price.isNaN()) continue
            quotes.add(
                MarketQuote(
                    id, names.getValue(id), AssetClass.CRYPTO,
                    price, if (change.isNaN()) 0.0 else change
                )
            )
        }
        return quotes
    }
}
