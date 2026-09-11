package com.marketcrash.predictor

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

data class MarketSnapshot(
    val quotes: List<MarketQuote>,
    val errors: List<String>
)

object DataRepository {

    private fun yahooUrl(symbol: String): String {
        val enc = java.net.URLEncoder.encode(symbol.uppercase(), "UTF-8")
        return "https://query1.finance.yahoo.com/v8/finance/chart/$enc?interval=1d&range=1d"
    }

    private const val COINGECKO_URL =
        "https://api.coingecko.com/api/v3/simple/price" +
            "?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"

    private fun httpGet(url: String): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        conn.setRequestProperty(
            "User-Agent",
            "Mozilla/5.0 (Linux; Android) MarketCrashPredictor/1.1 (personal market monitor)"
        )
        conn.setRequestProperty("Accept", "application/json, */*")
        return conn.inputStream.bufferedReader().use { it.readText() }
    }

    suspend fun fetchAll(): MarketSnapshot = withContext(Dispatchers.IO) {
        val errors = java.util.Collections.synchronizedList(mutableListOf<String>())
        coroutineScope {
            val yahooJobs = FeedParsers.YAHOO_SYMBOLS.keys.map { symbol ->
                async {
                    runCatching { FeedParsers.parseYahooChart(httpGet(yahooUrl(symbol)), symbol) }
                        .getOrElse { errors.add("Yahoo $symbol: ${it.message}"); null }
                }
            }
            val cryptoJob = async {
                runCatching { FeedParsers.parseCoinGecko(httpGet(COINGECKO_URL)) }
                    .getOrElse { errors.add("CoinGecko crypto feed: ${it.message}"); emptyList() }
            }
            val quotes = yahooJobs.mapNotNull { it.await() } + cryptoJob.await()
            quotes.forEach { HistoryStore.record(it.symbol, it.price) }
            MarketSnapshot(quotes, errors.toList())
        }
    }
}

/** In-session price history per symbol, feeding the dashboard sparklines. */
object HistoryStore {
    private const val MAX_POINTS = 48
    private val history = LinkedHashMap<String, ArrayDeque<Float>>()

    @Synchronized
    fun record(symbol: String, price: Double) {
        val deque = history.getOrPut(symbol) { ArrayDeque() }
        deque.addLast(price.toFloat())
        while (deque.size > MAX_POINTS) deque.removeFirst()
    }

    @Synchronized
    fun series(symbol: String): List<Float> = history[symbol]?.toList() ?: emptyList()
}
