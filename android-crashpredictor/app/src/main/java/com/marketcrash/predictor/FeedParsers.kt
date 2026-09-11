package com.marketcrash.predictor

import org.json.JSONObject

/**
 * Pure parsing functions for the free market feeds (unit-testable, no Android deps).
 *
 * Sources:
 *  - Yahoo Finance v8 chart API (indices, VIX, yields, metals, energy, FX) — no API key.
 *  - CoinGecko simple-price JSON (crypto) — no API key.
 *
 * (v1.0 used Stooq CSV quotes; Stooq retired that endpoint behind an anti-bot
 * wall, so v1.1 switched to Yahoo's chart API.)
 */
object FeedParsers {

    /** Static metadata for the Yahoo symbols we poll. */
    val YAHOO_SYMBOLS: Map<String, Pair<String, AssetClass>> = mapOf(
        "^gspc" to ("S&P 500" to AssetClass.EQUITY),
        "^dji" to ("Dow Jones" to AssetClass.EQUITY),
        "^ixic" to ("Nasdaq" to AssetClass.EQUITY),
        "^ftse" to ("FTSE 100" to AssetClass.EQUITY),
        "^n225" to ("Nikkei 225" to AssetClass.EQUITY),
        "^vix" to ("VIX Fear Index" to AssetClass.VOLATILITY),
        "^tnx" to ("US 10Y Yield" to AssetClass.BOND),
        "^irx" to ("US 3M Yield" to AssetClass.BOND),
        "gc=f" to ("Gold" to AssetClass.METAL),
        "si=f" to ("Silver" to AssetClass.METAL),
        "cl=f" to ("WTI Crude" to AssetClass.ENERGY),
        "eurusd=x" to ("EUR / USD" to AssetClass.FX),
        "jpy=x" to ("USD / JPY" to AssetClass.FX),
        "chf=x" to ("USD / CHF" to AssetClass.FX)
    )

    /**
     * Parses one Yahoo v8 chart response:
     * `{"chart":{"result":[{"meta":{"regularMarketPrice":..,"regularMarketChangePercent":..,
     *   "chartPreviousClose":..}}],"error":null}}`
     *
     * @param requestedSymbol the symbol we asked for (Yahoo sometimes rewrites
     *   FX symbols in `meta.symbol`, so we key on what we requested)
     * @return the quote, or null if the payload has no usable price
     */
    fun parseYahooChart(json: String, requestedSymbol: String): MarketQuote? {
        val key = requestedSymbol.lowercase()
        val meta = YAHOO_SYMBOLS[key] ?: return null
        val root = JSONObject(json)
        val result = root.optJSONObject("chart")?.optJSONArray("result") ?: return null
        if (result.length() == 0) return null
        val m = result.optJSONObject(0)?.optJSONObject("meta") ?: return null

        val price = m.optDouble("regularMarketPrice", Double.NaN)
        if (price.isNaN()) return null

        var change = m.optDouble("regularMarketChangePercent", Double.NaN)
        if (change.isNaN()) {
            val prev = m.optDouble("chartPreviousClose", Double.NaN)
            change = if (!prev.isNaN() && prev != 0.0) (price - prev) / prev * 100.0 else 0.0
        }
        return MarketQuote(key, meta.first, meta.second, price, change)
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
