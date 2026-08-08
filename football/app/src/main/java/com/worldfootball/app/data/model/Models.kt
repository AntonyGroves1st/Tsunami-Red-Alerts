package com.worldfootball.app.data.model

/** News category buckets the classifier can assign. */
enum class NewsCategory(val label: String) {
    BREAKING("Breaking"),
    TRANSFER("Transfers"),
    INJURY("Injuries"),
    MANAGER("Managers"),
    MEMORIAM("In Memoriam"),
    RESULT("Results"),
    GENERAL("Football")
}

data class NewsItem(
    val title: String,
    val summary: String,
    val link: String,
    val source: String,
    val publishedEpochMs: Long,
    val imageUrl: String? = null,
    val category: NewsCategory = NewsCategory.GENERAL
)

/** A fixture (upcoming) or result (finished) match. */
data class Match(
    val id: String,
    val league: String,
    val leagueBadge: String?,
    val homeTeam: String,
    val awayTeam: String,
    val homeBadge: String?,
    val awayBadge: String?,
    val homeScore: Int?,
    val awayScore: Int?,
    val kickoffEpochMs: Long?,
    val venue: String?,
    val statusText: String?
) {
    val isFinished: Boolean get() = homeScore != null && awayScore != null
    val scoreLine: String get() = if (isFinished) "$homeScore - $awayScore" else "vs"
}

data class WeatherNow(
    val venue: String,
    val city: String,
    val temperatureC: Double,
    val precipitationMm: Double,
    val windKph: Double,
    val weatherCode: Int
) {
    /** Rough "will it affect the match" verdict. */
    val severity: WeatherSeverity
        get() = when {
            precipitationMm >= 5.0 || windKph >= 55.0 || weatherCode in 95..99 -> WeatherSeverity.SEVERE
            precipitationMm >= 1.0 || windKph >= 35.0 || weatherCode in 71..77 -> WeatherSeverity.ROUGH
            else -> WeatherSeverity.CLEAR
        }

    val condition: String get() = wmoDescription(weatherCode)
}

enum class WeatherSeverity(val label: String) {
    CLEAR("Playable"),
    ROUGH("Tricky"),
    SEVERE("At risk")
}

fun wmoDescription(code: Int): String = when (code) {
    0 -> "Clear sky"
    1, 2, 3 -> "Partly cloudy"
    45, 48 -> "Fog"
    51, 53, 55 -> "Drizzle"
    56, 57 -> "Freezing drizzle"
    61, 63, 65 -> "Rain"
    66, 67 -> "Freezing rain"
    71, 73, 75 -> "Snow"
    77 -> "Snow grains"
    80, 81, 82 -> "Rain showers"
    85, 86 -> "Snow showers"
    95 -> "Thunderstorm"
    96, 99 -> "Thunderstorm + hail"
    else -> "Unknown"
}

/** Static curated player (Legends + Young Guns share this shape). */
data class Player(
    val name: String,
    val country: String,
    val position: String,
    val club: String,
    val rating: Int,
    val headline: String,
    val stats: List<StatLine>,
    val accent: Long
)

data class StatLine(val label: String, val value: String)

/** A WAG entry, framed around career/"brains" as well as public profile. */
data class Wag(
    val name: String,
    val partner: String,
    val brains: String,
    val looksScore: Int,
    val brainsScore: Int,
    val accent: Long
) {
    val overall: Int get() = ((looksScore + brainsScore) / 2.0).toInt()
}

data class BigStat(
    val headline: String,
    val value: String,
    val detail: String,
    val progress: Float,
    val accent: Long
)

/** A famous venue used for the match-day weather board. */
data class Venue(
    val stadium: String,
    val city: String,
    val latitude: Double,
    val longitude: Double
)
