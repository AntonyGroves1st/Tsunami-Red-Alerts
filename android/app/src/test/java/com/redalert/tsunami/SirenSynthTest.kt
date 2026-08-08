package com.redalert.tsunami

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class SirenSynthTest {

    @Test
    fun `generates the requested number of samples`() {
        val pcm = SirenSynth.generateSirenPcm(sampleRate = 22050, durationSec = 2.0)
        assertEquals(44100, pcm.size)
    }

    @Test
    fun `siren is loud but never clips`() {
        val pcm = SirenSynth.generateSirenPcm()
        val peak = pcm.maxOf { abs(it.toInt()) }
        assertTrue("peak $peak should be boosted above 90% of full scale", peak >= (Short.MAX_VALUE * 0.9).toInt())
        assertTrue("peak $peak must not exceed full scale", peak <= Short.MAX_VALUE.toInt())
    }

    @Test
    fun `siren is a real tone not silence`() {
        val pcm = SirenSynth.generateSirenPcm()
        val nonZero = pcm.count { it.toInt() != 0 }
        assertTrue("waveform should be almost entirely non-zero", nonZero > pcm.size * 9 / 10)
    }

    @Test
    fun `sweep rises then falls so the loop seam is smooth`() {
        val sampleRate = 22050
        val pcm = SirenSynth.generateSirenPcm(sampleRate = sampleRate, durationSec = 2.0)

        fun zeroCrossings(range: IntRange): Int {
            var count = 0
            for (i in range.first + 1..range.last) {
                if (pcm[i - 1] < 0 && pcm[i] >= 0) count++
            }
            return count
        }
        val startFreq = zeroCrossings(0 until sampleRate / 10) * 10
        val midFreq = zeroCrossings(pcm.size / 2 - sampleRate / 20 until pcm.size / 2 + sampleRate / 20) * 10
        val endFreq = zeroCrossings(pcm.size - sampleRate / 10 until pcm.size) * 10

        assertTrue("mid ($midFreq Hz) should be well above start ($startFreq Hz)", midFreq > startFreq + 400)
        assertTrue("end ($endFreq Hz) should fall back near start ($startFreq Hz)", abs(endFreq - startFreq) < 200)
    }
}
