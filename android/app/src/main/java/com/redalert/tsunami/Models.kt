package com.redalert.tsunami

/** Overall threat level, ordered from calm to catastrophic. */
enum class AlertLevel(val label: String) {
    GREEN("ALL CLEAR"),
    YELLOW("CAUTION"),
    ORANGE("TSUNAMI WATCH"),
    RED("RED ALERT")
}

data class Quake(
    val id: String,
    val magnitude: Double,
    val place: String,
    val timeMs: Long,
    val lat: Double,
    val lon: Double,
    val depthKm: Double,
    val tsunamiFlag: Boolean
)

data class TsunamiAlert(
    val event: String,
    val headline: String,
    val severity: String,
    val area: String
)

data class WaterReading(
    val timeMs: Long,
    val meters: Double
)

/** One buoy from the global NDBC latest-observations feed (includes DART and international partners). */
data class Buoy(
    val id: String,
    val lat: Double,
    val lon: Double,
    val timeMs: Long,
    val waveHeightM: Double?,
    val pressureHpa: Double?,
    val pressureTendencyHpa: Double?
)

/** A lat/lon bounding box around a rift, ridge, or subduction zone to watch. */
data class WatchRegion(
    val label: String,
    val minLat: Double,
    val maxLat: Double,
    val minLon: Double,
    val maxLon: Double
) {
    fun contains(lat: Double, lon: Double): Boolean =
        lat in minLat..maxLat && lon in minLon..maxLon

    companion object {
        val MID_ATLANTIC_RIDGE = WatchRegion("Mid-Atlantic Ridge (the Mid Rift)", -65.0, 80.0, -50.0, 0.0)
        val EAST_PACIFIC_RISE = WatchRegion("East Pacific Rise", -60.0, 30.0, -130.0, -95.0)
        val CASCADIA = WatchRegion("Cascadia / Juan de Fuca", 39.0, 52.0, -132.0, -120.0)
        val EAST_AFRICAN_RIFT = WatchRegion("East African Rift", -20.0, 20.0, 25.0, 45.0)
        val GLOBAL = WatchRegion("Global (everything)", -90.0, 90.0, -180.0, 180.0)
        val ALL = listOf(MID_ATLANTIC_RIDGE, EAST_PACIFIC_RISE, CASCADIA, EAST_AFRICAN_RIFT, GLOBAL)
    }
}
