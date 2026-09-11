package com.marketcrash.predictor

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.media.ToneGenerator
import java.util.Timer
import kotlin.concurrent.timer

/**
 * Audible siren for the full-screen crash alert.
 *
 * Primary path: loop the device's default alarm sound on the ALARM audio
 * stream (so it respects alarm volume, not media volume). Fallback when no
 * ringtone is available or MediaPlayer fails: a two-tone electronic siren
 * from [ToneGenerator].
 */
object AlarmSiren {

    private var player: MediaPlayer? = null
    private var toneGen: ToneGenerator? = null
    private var toneTimer: Timer? = null

    @Synchronized
    fun start(context: Context) {
        stop()
        val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        if (uri != null) {
            runCatching {
                MediaPlayer().apply {
                    setDataSource(context.applicationContext, uri)
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    isLooping = true
                    prepare()
                    start()
                    player = this
                }
            }.onFailure {
                player?.release()
                player = null
            }
        }
        if (player == null) startToneFallback()
    }

    private fun startToneFallback() {
        runCatching {
            val gen = ToneGenerator(AudioManager.STREAM_ALARM, 95)
            toneGen = gen
            var high = true
            toneTimer = timer("crash-siren", daemon = true, period = 650L) {
                runCatching {
                    gen.startTone(
                        if (high) ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK
                        else ToneGenerator.TONE_CDMA_HIGH_L,
                        600
                    )
                }
                high = !high
            }
        }
    }

    @Synchronized
    fun stop() {
        toneTimer?.cancel()
        toneTimer = null
        runCatching { toneGen?.release() }
        toneGen = null
        runCatching {
            player?.stop()
            player?.release()
        }
        player = null
    }
}
