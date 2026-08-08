package com.redalert.tsunami

import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/** Parsers for the public USGS, NWS, and NOAA CO-OPS JSON feeds. */
object FeedParsers {

    /** USGS earthquake GeoJSON summary feed. */
    fun parseUsgsQuakes(json: String): List<Quake> {
        val root = JSONObject(json)
        val features = root.optJSONArray("features") ?: return emptyList()
        val out = mutableListOf<Quake>()
        for (i in 0 until features.length()) {
            val f = features.optJSONObject(i) ?: continue
            val props = f.optJSONObject("properties") ?: continue
            val geom = f.optJSONObject("geometry") ?: continue
            val coords = geom.optJSONArray("coordinates") ?: continue
            if (coords.length() < 3) continue
            val mag = props.optDouble("mag", Double.NaN)
            if (mag.isNaN()) continue
            out.add(
                Quake(
                    id = f.optString("id", "q$i"),
                    magnitude = mag,
                    place = props.optString("place", "unknown location"),
                    timeMs = props.optLong("time", 0L),
                    lon = coords.optDouble(0, 0.0),
                    lat = coords.optDouble(1, 0.0),
                    depthKm = coords.optDouble(2, 0.0),
                    tsunamiFlag = props.optInt("tsunami", 0) == 1
                )
            )
        }
        return out.sortedByDescending { it.magnitude }
    }

    /** api.weather.gov active alerts, filtered down to tsunami-related events. */
    fun parseNwsTsunamiAlerts(json: String): List<TsunamiAlert> {
        val root = JSONObject(json)
        val features = root.optJSONArray("features") ?: return emptyList()
        val out = mutableListOf<TsunamiAlert>()
        for (i in 0 until features.length()) {
            val props = features.optJSONObject(i)?.optJSONObject("properties") ?: continue
            val event = props.optString("event", "")
            if (!event.lowercase(Locale.US).contains("tsunami")) continue
            out.add(
                TsunamiAlert(
                    event = event,
                    headline = props.optString("headline", event),
                    severity = props.optString("severity", "Unknown"),
                    area = props.optString("areaDesc", "")
                )
            )
        }
        return out
    }

    /** NOAA CO-OPS water_level response ({"data":[{"t":"2026-08-08 01:00","v":"1.234",...}]}). */
    fun parseCoopsWaterLevels(json: String): List<WaterReading> {
        val root = JSONObject(json)
        val data = root.optJSONArray("data") ?: return emptyList()
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("GMT")
        }
        val out = mutableListOf<WaterReading>()
        for (i in 0 until data.length()) {
            val row = data.optJSONObject(i) ?: continue
            val v = row.optString("v", "").toDoubleOrNull() ?: continue
            val t = runCatching { sdf.parse(row.optString("t", ""))?.time }.getOrNull() ?: continue
            out.add(WaterReading(t, v))
        }
        return out
    }
}
