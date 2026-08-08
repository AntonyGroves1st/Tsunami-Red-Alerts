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

    /**
     * NDBC latest observations for every reporting buoy in the world
     * (https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt).
     * Whitespace-separated columns; "MM" marks missing values:
     * STN LAT LON YYYY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES PTDY ATMP WTMP DEWP VIS TIDE
     */
    fun parseNdbcLatestObs(text: String): List<Buoy> {
        val out = mutableListOf<Buoy>()
        val cal = java.util.Calendar.getInstance(TimeZone.getTimeZone("GMT"))
        for (line in text.lineSequence()) {
            if (line.isBlank() || line.startsWith("#")) continue
            val c = line.trim().split(Regex("\\s+"))
            if (c.size < 17) continue
            val lat = c[1].toDoubleOrNull() ?: continue
            val lon = c[2].toDoubleOrNull() ?: continue
            val year = c[3].toIntOrNull() ?: continue
            val month = c[4].toIntOrNull() ?: continue
            val day = c[5].toIntOrNull() ?: continue
            val hour = c[6].toIntOrNull() ?: continue
            val minute = c[7].toIntOrNull() ?: continue
            cal.clear()
            cal.set(year, month - 1, day, hour, minute, 0)
            out.add(
                Buoy(
                    id = c[0],
                    lat = lat,
                    lon = lon,
                    timeMs = cal.timeInMillis,
                    waveHeightM = c[11].toDoubleOrNull(),
                    pressureHpa = c[15].toDoubleOrNull(),
                    pressureTendencyHpa = c[16].toDoubleOrNull()
                )
            )
        }
        return out
    }

    /** EMSC seismicportal.eu FDSN event feed (global coverage, complements USGS). */
    fun parseEmscQuakes(json: String): List<Quake> {
        val root = JSONObject(json)
        val features = root.optJSONArray("features") ?: return emptyList()
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("GMT")
        }
        val out = mutableListOf<Quake>()
        for (i in 0 until features.length()) {
            val f = features.optJSONObject(i) ?: continue
            val props = f.optJSONObject("properties") ?: continue
            val mag = props.optDouble("mag", Double.NaN)
            if (mag.isNaN()) continue
            val iso = props.optString("time", "").substringBefore(".").removeSuffix("Z")
            val timeMs = runCatching { sdf.parse(iso)?.time }.getOrNull() ?: continue
            out.add(
                Quake(
                    id = "emsc:" + props.optString("unid", f.optString("id", "e$i")),
                    magnitude = mag,
                    place = props.optString("flynn_region", "unknown region"),
                    timeMs = timeMs,
                    lat = props.optDouble("lat", 0.0),
                    lon = props.optDouble("lon", 0.0),
                    depthKm = props.optDouble("depth", 0.0),
                    tsunamiFlag = false
                )
            )
        }
        return out
    }

    /**
     * Merge quake lists from multiple networks, dropping duplicates of the same
     * physical event (within ~10 minutes and ~0.5 degrees). Earlier lists win.
     */
    fun mergeQuakes(vararg lists: List<Quake>): List<Quake> {
        val merged = mutableListOf<Quake>()
        for (list in lists) {
            for (q in list) {
                val dup = merged.any {
                    kotlin.math.abs(it.timeMs - q.timeMs) < 10 * 60 * 1000L &&
                        kotlin.math.abs(it.lat - q.lat) < 0.5 &&
                        kotlin.math.abs(it.lon - q.lon) < 0.5
                }
                if (!dup) merged.add(q)
            }
        }
        return merged.sortedByDescending { it.magnitude }
    }

    /**
     * IOC sea-level monitoring response for a global tide gauge
     * ([{"slevel":1.03,"stime":"2026-08-07 10:30:00","sensor":"prs"}, ...]).
     * Keeps only water-level sensors, ignoring barometric ("atm") and battery rows.
     */
    fun parseIocWaterLevels(json: String): List<WaterReading> {
        val arr = org.json.JSONArray(json)
        val waterSensors = setOf("prs", "rad", "flt", "enc", "pwl", "ra2", "prte", "bub", "stp")
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("GMT")
        }
        val out = mutableListOf<WaterReading>()
        for (i in 0 until arr.length()) {
            val row = arr.optJSONObject(i) ?: continue
            if (row.optString("sensor") !in waterSensors) continue
            val level = row.optDouble("slevel", Double.NaN)
            if (level.isNaN()) continue
            val t = runCatching { sdf.parse(row.optString("stime", ""))?.time }.getOrNull() ?: continue
            out.add(WaterReading(t, level))
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
