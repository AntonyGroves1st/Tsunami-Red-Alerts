package com.redalert.tsunami

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AlertEngineTest {

    private val ridge = WatchRegion.MID_ATLANTIC_RIDGE

    private fun quake(mag: Double, lat: Double, lon: Double, tsunami: Boolean = false) =
        Quake("id", mag, "test place", 0L, lat, lon, 10.0, tsunami)

    @Test
    fun `all quiet is green`() {
        val a = AlertEngine.assess(ridge, emptyList(), emptyList(), emptyList(), null)
        assertEquals(AlertLevel.GREEN, a.level)
    }

    @Test
    fun `tsunami warning is red`() {
        val a = AlertEngine.assess(
            ridge, emptyList(),
            listOf(TsunamiAlert("Tsunami Warning", "Tsunami Warning for the coast", "Extreme", "Coast")),
            emptyList(), null
        )
        assertEquals(AlertLevel.RED, a.level)
    }

    @Test
    fun `tsunami advisory is orange`() {
        val a = AlertEngine.assess(
            ridge, emptyList(),
            listOf(TsunamiAlert("Tsunami Advisory", "Advisory in effect", "Moderate", "Coast")),
            emptyList(), null
        )
        assertEquals(AlertLevel.ORANGE, a.level)
    }

    @Test
    fun `megaquake anywhere is red`() {
        val a = AlertEngine.assess(
            ridge, listOf(quake(8.3, -20.0, 170.0)), emptyList(), emptyList(), null
        )
        assertEquals(AlertLevel.RED, a.level)
    }

    @Test
    fun `m7_5 on the mid rift is red`() {
        val a = AlertEngine.assess(
            ridge, listOf(quake(7.6, 30.0, -40.0)), emptyList(), emptyList(), null
        )
        assertEquals(AlertLevel.RED, a.level)
        assertTrue(a.reasons.any { it.contains("watch zone") })
    }

    @Test
    fun `m6 off the rift stays green but m6 on the rift is yellow`() {
        val off = AlertEngine.assess(ridge, listOf(quake(6.0, 10.0, 120.0)), emptyList(), emptyList(), null)
        assertEquals(AlertLevel.GREEN, off.level)
        val on = AlertEngine.assess(ridge, listOf(quake(6.0, 10.0, -40.0)), emptyList(), emptyList(), null)
        assertEquals(AlertLevel.YELLOW, on.level)
    }

    @Test
    fun `usgs tsunami flag escalates to orange`() {
        val a = AlertEngine.assess(
            ridge, listOf(quake(6.4, 0.0, 100.0, tsunami = true)), emptyList(), emptyList(), null
        )
        assertEquals(AlertLevel.ORANGE, a.level)
    }

    @Test
    fun `water surge of 30cm in six minutes is red`() {
        val readings = listOf(
            WaterReading(0L, 1.00),
            WaterReading(360_000L, 1.02),
            WaterReading(720_000L, 1.32)
        )
        val a = AlertEngine.assess(ridge, emptyList(), emptyList(), readings, null)
        assertEquals(AlertLevel.RED, a.level)
    }

    @Test
    fun `normal tide movement stays green`() {
        val readings = listOf(
            WaterReading(0L, 1.00),
            WaterReading(360_000L, 1.02),
            WaterReading(720_000L, 1.04)
        )
        val a = AlertEngine.assess(ridge, emptyList(), emptyList(), readings, null)
        assertEquals(AlertLevel.GREEN, a.level)
    }

    @Test
    fun `pressure crash is orange and mild fall is yellow`() {
        val crash = AlertEngine.assess(ridge, emptyList(), emptyList(), emptyList(), -4.2)
        assertEquals(AlertLevel.ORANGE, crash.level)
        val fall = AlertEngine.assess(ridge, emptyList(), emptyList(), emptyList(), -1.8)
        assertEquals(AlertLevel.YELLOW, fall.level)
        val rising = AlertEngine.assess(ridge, emptyList(), emptyList(), emptyList(), 0.5)
        assertEquals(AlertLevel.GREEN, rising.level)
    }

    private fun buoy(lat: Double, lon: Double, wave: Double? = null, pres: Double? = null, tendency: Double? = null) =
        Buoy("41049", lat, lon, 0L, wave, pres, tendency)

    @Test
    fun `phenomenal seas at a buoy in zone is orange`() {
        val a = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(30.0, -40.0, wave = 13.5))
        )
        assertEquals(AlertLevel.ORANGE, a.level)
    }

    @Test
    fun `high seas at a buoy outside zone are ignored`() {
        val a = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(10.0, 150.0, wave = 13.5))
        )
        assertEquals(AlertLevel.GREEN, a.level)
    }

    @Test
    fun `violent low pressure at a buoy in zone is orange and deep low is yellow`() {
        val violent = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(30.0, -40.0, pres = 945.0))
        )
        assertEquals(AlertLevel.ORANGE, violent.level)
        val deep = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(30.0, -40.0, pres = 975.0))
        )
        assertEquals(AlertLevel.YELLOW, deep.level)
    }

    @Test
    fun `fast pressure drop at a buoy in zone is yellow`() {
        val a = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(30.0, -40.0, tendency = -6.2))
        )
        assertEquals(AlertLevel.YELLOW, a.level)
    }

    @Test
    fun `calm buoys stay green`() {
        val a = AlertEngine.assess(
            ridge, emptyList(), emptyList(), emptyList(), null,
            listOf(buoy(30.0, -40.0, wave = 1.5, pres = 1015.0, tendency = 0.4))
        )
        assertEquals(AlertLevel.GREEN, a.level)
    }

    @Test
    fun `worst signal wins`() {
        val a = AlertEngine.assess(
            ridge,
            listOf(quake(5.7, 30.0, -40.0)),
            listOf(TsunamiAlert("Tsunami Warning", "Warning", "Extreme", "Coast")),
            emptyList(), -1.8
        )
        assertEquals(AlertLevel.RED, a.level)
        assertTrue(a.reasons.size >= 3)
    }

    @Test
    fun `max six minute rise picks steepest jump`() {
        val readings = listOf(
            WaterReading(0L, 1.00),
            WaterReading(360_000L, 1.15),
            WaterReading(720_000L, 1.10)
        )
        assertEquals(15.0, AlertEngine.maxSixMinRiseCm(readings)!!, 0.01)
    }
}
