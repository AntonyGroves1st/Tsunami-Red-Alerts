package com.worldfootball.app.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Thin OkHttp wrapper over the free, key-less (or free-key) football sources:
 *  - TheSportsDB (free demo key "3") for fixtures + results
 *  - Open-Meteo for match-day weather
 *  - BBC Sport RSS for breaking football news
 */
class RemoteSources(
    private val client: OkHttpClient = defaultClient()
) {
    companion object {
        private const val SPORTSDB = "https://www.thesportsdb.com/api/v1/json/3"
        private const val OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

        /** Free football news feeds, merged for broad transfer/injury coverage. */
        val NEWS_FEEDS: List<Pair<String, String>> = listOf(
            "BBC Sport" to "https://feeds.bbci.co.uk/sport/football/rss.xml",
            "Sky Sports" to "https://www.skysports.com/rss/12040",
            "The Guardian" to "https://www.theguardian.com/football/rss"
        )

        // A browser-like UA maximises RSS feed compatibility (some feeds block bots).
        private const val UA =
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36 WorldFootball/1.0"

        fun defaultClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }

    suspend fun nextEvents(leagueId: String): String =
        get("$SPORTSDB/eventsnextleague.php?id=$leagueId")

    suspend fun pastEvents(leagueId: String): String =
        get("$SPORTSDB/eventspastleague.php?id=$leagueId")

    suspend fun weather(lat: Double, lon: Double): String =
        get("$OPEN_METEO?latitude=$lat&longitude=$lon&current=temperature_2m,precipitation,wind_speed_10m,weather_code")

    suspend fun feed(url: String): String = get(url)

    suspend fun searchPlayer(name: String): String {
        val q = java.net.URLEncoder.encode(name, "UTF-8")
        return get("$SPORTSDB/searchplayers.php?p=$q")
    }

    /** Wikipedia REST summary (contains a Commons-hosted lead image). */
    suspend fun wikipediaImage(title: String): String {
        val t = java.net.URLEncoder.encode(title.trim().replace(' ', '_'), "UTF-8")
        return get("https://en.wikipedia.org/api/rest_v1/page/summary/$t")
    }

    private suspend fun get(url: String): String = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", UA)
                .build()
            client.newCall(request).execute().use { resp ->
                if (!resp.isSuccessful) "" else resp.body?.string().orEmpty()
            }
        } catch (t: Throwable) {
            ""
        }
    }
}
