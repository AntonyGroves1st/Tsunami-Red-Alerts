package com.worldfootball.app.data.parse

import com.worldfootball.app.data.model.Match
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Parses TheSportsDB event feeds (eventsnextleague / eventspastleague) into
 * [Match]es. Uses org.json (Android built-in; added as a test dependency for
 * JVM unit tests).
 */
object SportsDbParser {

    private val timestampFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.ENGLISH)
        .apply { timeZone = TimeZone.getTimeZone("UTC") }

    fun parseEvents(json: String): List<Match> {
        if (json.isBlank()) return emptyList()
        return try {
            val root = JSONObject(json)
            if (root.isNull("events")) return emptyList()
            val arr = root.optJSONArray("events") ?: return emptyList()
            val out = ArrayList<Match>(arr.length())
            for (i in 0 until arr.length()) {
                val e = arr.optJSONObject(i) ?: continue
                val id = e.optString("idEvent")
                if (id.isBlank()) continue
                out.add(
                    Match(
                        id = id,
                        league = e.optString("strLeague").ifBlank { "Football" },
                        leagueBadge = e.strOrNull("strLeagueBadge"),
                        homeTeam = e.optString("strHomeTeam"),
                        awayTeam = e.optString("strAwayTeam"),
                        homeBadge = e.strOrNull("strHomeTeamBadge"),
                        awayBadge = e.strOrNull("strAwayTeamBadge"),
                        homeScore = e.intOrNull("intHomeScore"),
                        awayScore = e.intOrNull("intAwayScore"),
                        kickoffEpochMs = parseTimestamp(e.optString("strTimestamp")),
                        venue = e.strOrNull("strVenue"),
                        statusText = e.strOrNull("strStatus")
                    )
                )
            }
            out
        } catch (t: Throwable) {
            emptyList()
        }
    }

    /** Returns the best portrait (cutout preferred, then thumb) from a searchplayers response. */
    fun parsePlayerImage(json: String): String? {
        if (json.isBlank()) return null
        return try {
            val arr = JSONObject(json).optJSONArray("player") ?: return null
            val p = arr.optJSONObject(0) ?: return null
            p.strOrNull("strCutout") ?: p.strOrNull("strThumb") ?: p.strOrNull("strRender")
        } catch (t: Throwable) {
            null
        }
    }

    private fun parseTimestamp(raw: String?): Long? {
        if (raw.isNullOrBlank()) return null
        val cleaned = raw.substringBefore("+").substringBefore(".").trim()
        return runCatching { timestampFmt.parse(cleaned)?.time }.getOrNull()
    }

    private fun JSONObject.strOrNull(key: String): String? {
        if (isNull(key)) return null
        val v = optString(key)
        return if (v.isBlank() || v == "null") null else v
    }

    private fun JSONObject.intOrNull(key: String): Int? {
        if (isNull(key)) return null
        val v = optString(key)
        if (v.isBlank() || v == "null") return null
        return v.toIntOrNull()
    }
}
