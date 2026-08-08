package com.redalert.tsunami

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

data class Snapshot(
    val quakes: List<Quake>,
    val tsunamiAlerts: List<TsunamiAlert>,
    val waterReadings: List<WaterReading>,
    val errors: List<String>
)

object DataRepository {

    private const val USGS_FEED =
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
    private const val NWS_ALERTS = "https://api.weather.gov/alerts/active"

    private fun coopsUrl(station: String) =
        "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
            "?product=water_level&application=tsunami_red_alert&range=2" +
            "&station=$station&datum=MLLW&units=metric&time_zone=gmt&format=json"

    private fun httpGet(url: String): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        conn.setRequestProperty("User-Agent", "TsunamiRedAlert/1.0 (personal safety monitor)")
        conn.setRequestProperty("Accept", "application/geo+json, application/json")
        return conn.inputStream.bufferedReader().use { it.readText() }
    }

    suspend fun fetchAll(stationId: String): Snapshot = withContext(Dispatchers.IO) {
        val errors = mutableListOf<String>()
        coroutineScope {
            val quakesJob = async {
                runCatching { FeedParsers.parseUsgsQuakes(httpGet(USGS_FEED)) }
                    .getOrElse { errors.add("USGS quake feed: ${it.message}"); emptyList() }
            }
            val alertsJob = async {
                runCatching { FeedParsers.parseNwsTsunamiAlerts(httpGet(NWS_ALERTS)) }
                    .getOrElse { errors.add("NWS alert feed: ${it.message}"); emptyList() }
            }
            val waterJob = async {
                if (stationId.isBlank()) emptyList()
                else runCatching { FeedParsers.parseCoopsWaterLevels(httpGet(coopsUrl(stationId))) }
                    .getOrElse { errors.add("NOAA tide station $stationId: ${it.message}"); emptyList() }
            }
            Snapshot(quakesJob.await(), alertsJob.await(), waterJob.await(), errors)
        }
    }
}
