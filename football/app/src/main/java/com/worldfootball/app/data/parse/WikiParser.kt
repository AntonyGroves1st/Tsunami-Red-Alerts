package com.worldfootball.app.data.parse

import org.json.JSONObject

/**
 * Extracts the lead image from a Wikipedia REST "page/summary" response.
 * Wikipedia lead images are hosted on Wikimedia Commons (freely licensed),
 * which makes them safe to display in a fan app.
 */
object WikiParser {

    fun parseImage(json: String): String? {
        if (json.isBlank()) return null
        return try {
            val o = JSONObject(json)
            val thumb = o.optJSONObject("thumbnail")?.optString("source")
            val original = o.optJSONObject("originalimage")?.optString("source")
            (thumb ?: original)?.takeIf { it.isNotBlank() && it != "null" }
        } catch (t: Throwable) {
            null
        }
    }
}
