package com.redalert.tsunami

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack

/**
 * Plays the synthesized siren in an endless loop on the ALARM audio stream,
 * boosting the alarm volume to maximum while active and restoring the user's
 * previous volume when stopped.
 */
class AlarmSiren(private val context: Context) {

    private var track: AudioTrack? = null
    private var previousAlarmVolume = -1

    val isPlaying: Boolean get() = track != null

    fun start() {
        if (track != null) return
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        previousAlarmVolume = am.getStreamVolume(AudioManager.STREAM_ALARM)
        runCatching {
            am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0)
        }

        val sampleRate = 22050
        val pcm = SirenSynth.generateSirenPcm(sampleRate = sampleRate)
        val t = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(sampleRate)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setTransferMode(AudioTrack.MODE_STATIC)
            .setBufferSizeInBytes(pcm.size * 2)
            .build()
        t.write(pcm, 0, pcm.size)
        t.setLoopPoints(0, pcm.size, -1)
        t.setVolume(AudioTrack.getMaxVolume())
        t.play()
        track = t
    }

    fun stop() {
        track?.let { runCatching { it.stop(); it.release() } }
        track = null
        if (previousAlarmVolume >= 0) {
            val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            runCatching { am.setStreamVolume(AudioManager.STREAM_ALARM, previousAlarmVolume, 0) }
            previousAlarmVolume = -1
        }
    }
}
