package com.redalert.tsunami

import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.sin

/**
 * Generates the siren tone as raw PCM so no audio asset is needed and the
 * waveform is fully testable.
 *
 * This is not a gentle sine "tingle": it's a harsh, horn-like civil-defense
 * wail. The fundamental sweeps up from [minHz] to [maxHz] and back (the classic
 * siren rise/fall), layered with decaying harmonics for a buzzy, boosted timbre
 * and a fast amplitude tremolo so it "whoops" urgently. The whole waveform is
 * normalized to [amplitude] of full scale — as loud as possible without clipping.
 */
object SirenSynth {

    /** Harmonic weights on top of the fundamental. Kept below the fundamental so
     * the tone stays rich/harsh while the fundamental still dominates the pitch. */
    private val HARMONICS = doubleArrayOf(1.0, 0.45, 0.28, 0.16)

    /** Urgent "whoop" tremolo rate in Hz; stays strictly positive so it never
     * mutes the tone or changes zero crossings. */
    private const val TREMOLO_HZ = 7.0

    fun generateSirenPcm(
        sampleRate: Int = 22050,
        durationSec: Double = 2.0,
        minHz: Double = 550.0,
        maxHz: Double = 1350.0,
        amplitude: Double = 0.98
    ): ShortArray {
        val n = (sampleRate * durationSec).toInt()
        val raw = DoubleArray(n)
        var phase = 0.0
        for (i in 0 until n) {
            val t = i.toDouble() / n
            val sweep = if (t < 0.5) t * 2.0 else (1.0 - t) * 2.0
            val freq = minHz + (maxHz - minHz) * sweep
            phase += 2.0 * PI * freq / sampleRate

            var sample = 0.0
            for (h in HARMONICS.indices) {
                sample += HARMONICS[h] * sin((h + 1) * phase)
            }

            // Amplitude tremolo in the range ~[0.35, 1.0]: sign-preserving, so it
            // adds urgency without affecting pitch or zero crossings.
            val timeSec = i.toDouble() / sampleRate
            val tremolo = 0.675 + 0.325 * sin(2.0 * PI * TREMOLO_HZ * timeSec)
            raw[i] = sample * tremolo
        }

        // Normalize so the loudest sample sits at exactly [amplitude] of full
        // scale: maximally loud, guaranteed never to clip.
        var peak = 0.0
        for (v in raw) {
            val a = abs(v)
            if (a > peak) peak = a
        }
        val scale = if (peak > 0.0) amplitude * Short.MAX_VALUE / peak else 0.0

        val out = ShortArray(n)
        for (i in 0 until n) {
            out[i] = (raw[i] * scale).toInt().toShort()
        }
        return out
    }
}
