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
    val buoys: List<Buoy>,
    val errors: List<String>
)

object DataRepository {

    private const val USGS_FEED =
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson"
    private const val EMSC_FEED =
        "https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=200&minmag=4.5"
    private const val NWS_ALERTS = "https://api.weather.gov/alerts/active"
    private const val NDBC_LATEST_OBS =
        "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt"

    /** Prefix for global IOC tide gauges in the station field, e.g. "ioc:stan2". */
    private const val IOC_PREFIX = "ioc:"

    private fun coopsUrl(station: String) =
        "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
            "?product=water_level&application=tsunami_red_alert&range=2" +
            "&station=$station&datum=MLLW&units=metric&time_zone=gmt&format=json"

    private fun iocUrl(code: String) =
        "https://www.ioc-sealevelmonitoring.org/service.php?query=data&code=$code&format=json"

    private fun httpGet(url: String): String {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15000
        conn.readTimeout = 20000
        conn.setRequestProperty("User-Agent", "TsunamiRedAlert/1.2 (personal safety monitor)")
        conn.setRequestProperty("Accept", "application/geo+json, application/json, text/plain")
        return conn.inputStream.bufferedReader().use { it.readText() }
    }

    suspend fun fetchAll(stationId: String): Snapshot = withContext(Dispatchers.IO) {
        val errors = mutableListOf<String>()
        coroutineScope {
            val usgsJob = async {
                runCatching { FeedParsers.parseUsgsQuakes(httpGet(USGS_FEED)) }
                    .getOrElse { errors.add("USGS quake feed: ${it.message}"); emptyList() }
            }
            val emscJob = async {
                runCatching { FeedParsers.parseEmscQuakes(httpGet(EMSC_FEED)) }
                    .getOrElse { errors.add("EMSC quake feed: ${it.message}"); emptyList() }
            }
            val alertsJob = async {
                runCatching { FeedParsers.parseNwsTsunamiAlerts(httpGet(NWS_ALERTS)) }
                    .getOrElse { errors.add("NWS alert feed: ${it.message}"); emptyList() }
            }
            val buoysJob = async {
                runCatching { FeedParsers.parseNdbcLatestObs(httpGet(NDBC_LATEST_OBS)) }
                    .getOrElse { errors.add("NDBC global buoy feed: ${it.message}"); emptyList() }
            }
            val waterJob = async {
                val station = stationId.trim()
                when {
                    station.isBlank() -> emptyList()
                    station.startsWith(IOC_PREFIX, ignoreCase = true) -> {
                        val code = station.substring(IOC_PREFIX.length).trim()
                        runCatching { FeedParsers.parseIocWaterLevels(httpGet(iocUrl(code))) }
                            .getOrElse { errors.add("IOC tide gauge $code: ${it.message}"); emptyList() }
                    }
                    else ->
                        runCatching { FeedParsers.parseCoopsWaterLevels(httpGet(coopsUrl(station))) }
                            .getOrElse { errors.add("NOAA tide station $station: ${it.message}"); emptyList() }
                }
            }
            Snapshot(
                quakes = FeedParsers.mergeQuakes(usgsJob.await(), emscJob.await()),
                tsunamiAlerts = alertsJob.await(),
                waterReadings = waterJob.await(),
                buoys = buoysJob.await(),
                errors = errors
            )
        }
    }
}
