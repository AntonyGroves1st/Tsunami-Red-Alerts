package com.worldfootball.app.data.parse

import com.worldfootball.app.data.model.Venue
import com.worldfootball.app.data.model.WeatherNow
import org.json.JSONObject

/** Parses an Open-Meteo `current` block into [WeatherNow]. */
object WeatherParser {

    fun parse(json: String, venue: Venue): WeatherNow? {
        if (json.isBlank()) return null
        return try {
            val current = JSONObject(json).optJSONObject("current") ?: return null
            WeatherNow(
                venue = venue.stadium,
                city = venue.city,
                temperatureC = current.optDouble("temperature_2m", Double.NaN)
                    .let { if (it.isNaN()) 0.0 else it },
                precipitationMm = current.optDouble("precipitation", 0.0),
                windKph = current.optDouble("wind_speed_10m", 0.0),
                weatherCode = current.optInt("weather_code", 0)
            )
        } catch (t: Throwable) {
            null
        }
    }
}
