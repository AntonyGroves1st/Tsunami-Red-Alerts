package com.redalert.tsunami

import java.util.Locale

data class Assessment(val level: AlertLevel, val reasons: List<String>)

/**
 * Pure-logic threat assessor. Combines official tsunami alerts, seismicity in the
 * watched rift/ridge zone, rapid coastal water-level rise, and barometric pressure
 * crash into a single GREEN / YELLOW / ORANGE / RED level.
 */
object AlertEngine {

    fun assess(
        region: WatchRegion,
        quakes: List<Quake>,
        tsunamiAlerts: List<TsunamiAlert>,
        waterReadings: List<WaterReading>,
        pressureTrendHpaPerHr: Double?,
        buoys: List<Buoy> = emptyList()
    ): Assessment {
        var level = AlertLevel.GREEN
        val reasons = mutableListOf<String>()

        fun raise(to: AlertLevel, why: String) {
            if (to.ordinal > level.ordinal) level = to
            reasons.add(why)
        }

        for (a in tsunamiAlerts) {
            val e = a.event.lowercase(Locale.US)
            when {
                "warning" in e -> raise(AlertLevel.RED, "ACTIVE ${a.event.uppercase(Locale.US)} — ${a.headline}")
                "advisory" in e || "watch" in e -> raise(AlertLevel.ORANGE, "Active ${a.event} — ${a.headline}")
                else -> raise(AlertLevel.YELLOW, "Tsunami statement — ${a.headline}")
            }
        }

        for (q in quakes) {
            val inRegion = region.contains(q.lat, q.lon)
            val m = q.magnitude
            when {
                m >= 8.0 ->
                    raise(AlertLevel.RED, fmt("M%.1f MEGAQUAKE — %s", m, q.place))
                inRegion && m >= 7.5 ->
                    raise(AlertLevel.RED, fmt("M%.1f major quake on watch zone — %s", m, q.place))
                m >= 7.0 ->
                    raise(AlertLevel.ORANGE, fmt("M%.1f major quake — %s", m, q.place))
                inRegion && m >= 6.5 ->
                    raise(AlertLevel.ORANGE, fmt("M%.1f strong quake on watch zone — %s", m, q.place))
                inRegion && m >= 5.5 ->
                    raise(AlertLevel.YELLOW, fmt("M%.1f quake on watch zone — %s", m, q.place))
            }
            if (q.tsunamiFlag && m >= 6.0) {
                raise(AlertLevel.ORANGE, fmt("USGS flagged tsunami potential: M%.1f — %s", m, q.place))
            }
        }

        maxSixMinRiseCm(waterReadings)?.let { riseCm ->
            when {
                riseCm >= 25.0 -> raise(AlertLevel.RED, fmt("WATER SURGING: +%.0f cm in 6 min at tide station", riseCm))
                riseCm >= 10.0 -> raise(AlertLevel.ORANGE, fmt("Rapid water rise: +%.0f cm in 6 min at tide station", riseCm))
                riseCm >= 5.0 -> raise(AlertLevel.YELLOW, fmt("Water rising fast: +%.0f cm in 6 min at tide station", riseCm))
            }
        }

        pressureTrendHpaPerHr?.let { t ->
            when {
                t <= -3.0 -> raise(AlertLevel.ORANGE, fmt("Barometric pressure crashing (%.1f hPa/hr)", t))
                t <= -1.5 -> raise(AlertLevel.YELLOW, fmt("Barometric pressure falling (%.1f hPa/hr)", t))
            }
        }

        for (b in buoys) {
            if (!region.contains(b.lat, b.lon)) continue
            b.waveHeightM?.let { h ->
                when {
                    h >= 12.0 -> raise(AlertLevel.ORANGE, fmt("Buoy %s reporting PHENOMENAL %.1f m seas", b.id, h))
                    h >= 8.0 -> raise(AlertLevel.YELLOW, fmt("Buoy %s reporting very high %.1f m seas", b.id, h))
                }
            }
            b.pressureHpa?.let { p ->
                when {
                    p <= 950.0 -> raise(AlertLevel.ORANGE, fmt("Buoy %s in violent low (%.0f hPa)", b.id, p))
                    p <= 980.0 -> raise(AlertLevel.YELLOW, fmt("Buoy %s in deep low (%.0f hPa)", b.id, p))
                }
            }
            b.pressureTendencyHpa?.let { d ->
                if (d <= -5.0) raise(AlertLevel.YELLOW, fmt("Buoy %s pressure dropping fast (%+.1f hPa/3h)", b.id, d))
            }
        }

        if (reasons.isEmpty()) reasons.add("No threats detected. Monitoring ${region.label}.")
        return Assessment(level, reasons)
    }

    /**
     * Largest rise between consecutive 6-minute NOAA tide-gauge readings, in cm.
     * Normal tides move a few cm per reading; a tsunami or storm surge jumps.
     */
    fun maxSixMinRiseCm(readings: List<WaterReading>): Double? {
        if (readings.size < 2) return null
        val sorted = readings.sortedBy { it.timeMs }
        var max = Double.NEGATIVE_INFINITY
        for (i in 1 until sorted.size) {
            val deltaCm = (sorted[i].meters - sorted[i - 1].meters) * 100.0
            if (deltaCm > max) max = deltaCm
        }
        return max
    }

    private fun fmt(pattern: String, vararg args: Any?) = String.format(Locale.US, pattern, *args)
}
