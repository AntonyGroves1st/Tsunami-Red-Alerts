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
    fun `parses ndbc global buoy feed`() {
        val text = """
            #STN       LAT      LON  YYYY MM DD hh mm WDIR WSPD   GST WVHT  DPD APD MWD   PRES  PTDY  ATMP  WTMP  DEWP  VIS   TIDE
            #text      deg      deg   yr mo day hr mn degT  m/s   m/s   m   sec sec degT   hPa   hPa  degC  degC  degC  nmi     ft
            41049    27.49   -62.94  2026 08 08 03 00 145   5.4    MM  2.5  MM   MM  MM  1013.2  -5.5  23.9  25.7    MM   MM     MM
            22101    37.24   126.02  2026 08 08 03 00 110   3.0    MM   MM   0   MM  MM     MM    MM  28.5  26.2    MM   MM     MM
        """.trimIndent()
        val buoys = FeedParsers.parseNdbcLatestObs(text)
        assertEquals(2, buoys.size)
        val b = buoys[0]
        assertEquals("41049", b.id)
        assertEquals(27.49, b.lat, 0.001)
        assertEquals(-62.94, b.lon, 0.001)
        assertEquals(2.5, b.waveHeightM!!, 0.001)
        assertEquals(1013.2, b.pressureHpa!!, 0.001)
        assertEquals(-5.5, b.pressureTendencyHpa!!, 0.001)
        assertEquals(null, buoys[1].waveHeightM)
        assertEquals(null, buoys[1].pressureHpa)
    }

    @Test
    fun `parses emsc quake feed`() {
        val json = """
        {
          "features": [
            {
              "id": "20260808_0000049",
              "properties": {
                "time": "2026-08-08T03:59:31.81Z", "flynn_region": "KERMADEC ISLANDS REGION",
                "lat": -28.4766, "lon": -176.5487, "depth": 10.0, "mag": 5.0, "unid": "20260808_0000049"
              }
            }
          ]
        }
        """.trimIndent()
        val quakes = FeedParsers.parseEmscQuakes(json)
        assertEquals(1, quakes.size)
        assertEquals(5.0, quakes[0].magnitude, 0.001)
        assertEquals("KERMADEC ISLANDS REGION", quakes[0].place)
        assertEquals(-28.4766, quakes[0].lat, 0.001)
        assertTrue(quakes[0].id.startsWith("emsc:"))
        assertTrue(quakes[0].timeMs > 0)
    }

    @Test
    fun `merges quake networks and drops duplicates`() {
        val usgs = listOf(Quake("us1", 6.0, "Ridge", 1_000_000L, 10.0, -40.0, 10.0, false))
        val emsc = listOf(
            Quake("emsc:1", 5.9, "Ridge (EMSC)", 1_060_000L, 10.1, -40.2, 12.0, false),
            Quake("emsc:2", 4.9, "Elsewhere", 1_000_000L, -30.0, 100.0, 30.0, false)
        )
        val merged = FeedParsers.mergeQuakes(usgs, emsc)
        assertEquals(2, merged.size)
        assertEquals("us1", merged[0].id)
        assertEquals("emsc:2", merged[1].id)
    }

    @Test
    fun `parses ioc water levels and skips non-water sensors`() {
        val json = """
        [
          {"slevel": 1.031, "stime": "2026-08-07 10:30:00", "sensor": "atm"},
          {"slevel": 2.115, "stime": "2026-08-07 10:30:00", "sensor": "prs"},
          {"slevel": 2.118, "stime": "2026-08-07 10:36:00", "sensor": "rad"}
        ]
        """.trimIndent()
        val readings = FeedParsers.parseIocWaterLevels(json)
        assertEquals(2, readings.size)
        assertEquals(2.115, readings[0].meters, 0.0001)
        assertEquals(360_000L, readings[1].timeMs - readings[0].timeMs)
    }

    @Test
    fun `handles malformed feeds gracefully`() {
        assertTrue(FeedParsers.parseUsgsQuakes("{}").isEmpty())
        assertTrue(FeedParsers.parseNwsTsunamiAlerts("{}").isEmpty())
        assertTrue(FeedParsers.parseCoopsWaterLevels("{\"error\":{\"message\":\"no data\"}}").isEmpty())
        assertTrue(FeedParsers.parseEmscQuakes("{}").isEmpty())
        assertTrue(FeedParsers.parseNdbcLatestObs("#only comments\n").isEmpty())
        assertTrue(FeedParsers.parseIocWaterLevels("[]").isEmpty())
    }
}
