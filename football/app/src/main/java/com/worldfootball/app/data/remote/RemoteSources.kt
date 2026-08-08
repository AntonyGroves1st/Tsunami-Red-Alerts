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
        const val BBC_FOOTBALL_RSS = "https://feeds.bbci.co.uk/sport/football/rss.xml"

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

    suspend fun bbcFootball(): String = get(BBC_FOOTBALL_RSS)

    private suspend fun get(url: String): String = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "WorldFootball/1.0 (Android)")
                .build()
            client.newCall(request).execute().use { resp ->
                if (!resp.isSuccessful) "" else resp.body?.string().orEmpty()
            }
        } catch (t: Throwable) {
            ""
        }
    }
}
