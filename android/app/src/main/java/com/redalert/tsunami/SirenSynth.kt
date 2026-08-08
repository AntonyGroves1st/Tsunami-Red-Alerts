package com.redalert.tsunami

import kotlin.math.PI
import kotlin.math.sin

/**
 * Generates the siren tone as raw PCM so no audio asset is needed and the
 * waveform is fully testable: a sine sweep that climbs from [minHz] to
 * [maxHz] and falls back, like a civil-defense siren.
 */
object SirenSynth {

    fun generateSirenPcm(
        sampleRate: Int = 22050,
        durationSec: Double = 2.0,
        minHz: Double = 550.0,
        maxHz: Double = 1350.0,
        amplitude: Double = 0.95
    ): ShortArray {
        val n = (sampleRate * durationSec).toInt()
        val out = ShortArray(n)
        var phase = 0.0
        for (i in 0 until n) {
            val t = i.toDouble() / n
            val sweep = if (t < 0.5) t * 2.0 else (1.0 - t) * 2.0
            val freq = minHz + (maxHz - minHz) * sweep
            phase += 2.0 * PI * freq / sampleRate
            out[i] = (sin(phase) * amplitude * Short.MAX_VALUE).toInt().toShort()
        }
        return out
    }
}
