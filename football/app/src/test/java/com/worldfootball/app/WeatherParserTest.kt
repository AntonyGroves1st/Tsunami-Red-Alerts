package com.worldfootball.app

import com.worldfootball.app.data.model.Venue
import com.worldfootball.app.data.model.WeatherSeverity
import com.worldfootball.app.data.parse.WeatherParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WeatherParserTest {

    private val venue = Venue("Old Trafford", "Manchester", 53.46, -2.29)

    private fun json(temp: Double, precip: Double, wind: Double, code: Int) = """
        {"current":{"time":"2026-08-08T09:15","temperature_2m":$temp,
         "precipitation":$precip,"wind_speed_10m":$wind,"weather_code":$code}}
    """.trimIndent()

    @Test
    fun `parses current block`() {
        val w = WeatherParser.parse(json(20.2, 0.0, 12.0, 3), venue)!!
        assertEquals("Old Trafford", w.venue)
        assertEquals("Manchester", w.city)
        assertEquals(20, w.temperatureC.toInt())
        assertEquals("Partly cloudy", w.condition)
        assertEquals(WeatherSeverity.CLEAR, w.severity)
    }

    @Test
    fun `heavy rain or storm flags the match at risk`() {
        assertEquals(WeatherSeverity.SEVERE, WeatherParser.parse(json(14.0, 6.5, 20.0, 61), venue)!!.severity)
        assertEquals(WeatherSeverity.SEVERE, WeatherParser.parse(json(14.0, 0.0, 20.0, 95), venue)!!.severity)
        assertEquals(WeatherSeverity.SEVERE, WeatherParser.parse(json(14.0, 0.0, 60.0, 3), venue)!!.severity)
    }

    @Test
    fun `light rain or breeze is tricky`() {
        assertEquals(WeatherSeverity.ROUGH, WeatherParser.parse(json(14.0, 2.0, 20.0, 61), venue)!!.severity)
    }

    @Test
    fun `malformed payload is null`() {
        assertNull(WeatherParser.parse("", venue))
        assertNull(WeatherParser.parse("{}", venue))
    }
}
