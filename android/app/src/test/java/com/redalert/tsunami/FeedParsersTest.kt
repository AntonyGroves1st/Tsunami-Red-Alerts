package com.redalert.tsunami

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class FeedParsersTest {

    @Test
    fun `parses usgs geojson feed`() {
        val json = """
        {
          "features": [
            {
              "id": "us123",
              "properties": {"mag": 6.1, "place": "Reykjanes Ridge", "time": 1723075200000, "tsunami": 1},
              "geometry": {"coordinates": [-35.2, 55.1, 10.5]}
            },
            {
              "id": "us456",
              "properties": {"mag": 4.6, "place": "Fiji region", "time": 1723075100000, "tsunami": 0},
              "geometry": {"coordinates": [178.1, -17.8, 550.0]}
            }
          ]
        }
        """.trimIndent()
        val quakes = FeedParsers.parseUsgsQuakes(json)
        assertEquals(2, quakes.size)
        assertEquals(6.1, quakes[0].magnitude, 0.001)
        assertEquals(55.1, quakes[0].lat, 0.001)
        assertEquals(-35.2, quakes[0].lon, 0.001)
        assertTrue(quakes[0].tsunamiFlag)
        assertTrue(WatchRegion.MID_ATLANTIC_RIDGE.contains(quakes[0].lat, quakes[0].lon))
    }

    @Test
    fun `filters nws alerts down to tsunami events`() {
        val json = """
        {
          "features": [
            {"properties": {"event": "Tsunami Warning", "headline": "Tsunami Warning issued", "severity": "Extreme", "areaDesc": "Pacific coast"}},
            {"properties": {"event": "Severe Thunderstorm Warning", "headline": "Storms", "severity": "Severe", "areaDesc": "Kansas"}}
          ]
        }
        """.trimIndent()
        val alerts = FeedParsers.parseNwsTsunamiAlerts(json)
        assertEquals(1, alerts.size)
        assertEquals("Tsunami Warning", alerts[0].event)
    }

    @Test
    fun `parses coops water levels`() {
        val json = """
        {
          "data": [
            {"t": "2026-08-08 01:00", "v": "1.234"},
            {"t": "2026-08-08 01:06", "v": "1.260"},
            {"t": "2026-08-08 01:12", "v": ""}
          ]
        }
        """.trimIndent()
        val readings = FeedParsers.parseCoopsWaterLevels(json)
        assertEquals(2, readings.size)
        assertEquals(1.234, readings[0].meters, 0.0001)
        assertEquals(360_000L, readings[1].timeMs - readings[0].timeMs)
    }

    @Test
    fun `handles malformed feeds gracefully`() {
        assertTrue(FeedParsers.parseUsgsQuakes("{}").isEmpty())
        assertTrue(FeedParsers.parseNwsTsunamiAlerts("{}").isEmpty())
        assertTrue(FeedParsers.parseCoopsWaterLevels("{\"error\":{\"message\":\"no data\"}}").isEmpty())
    }
}
