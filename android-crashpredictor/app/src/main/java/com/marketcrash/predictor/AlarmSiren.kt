package com.marketcrash.predictor

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.os.Build
import java.util.Timer
import kotlin.concurrent.timer
import kotlin.math.max

/**
 * Audible siren for the full-screen crash alert. Built to actually be heard:
 *
 *  1. Takes transient audio focus as an ALARM (ducks music/podcasts).
 *  2. Temporarily raises the ALARM stream to at least 75% volume if the user
 *     has it muted/low, and restores the previous volume on stop.
 *  3. Loops the device's default alarm tone via MediaPlayer; if that fails or
 *     is silently not playing, falls back to a two-tone ToneGenerator siren.
 */
object AlarmSiren {

    private var player: MediaPlayer? = null
    private var toneGen: ToneGenerator? = null
    private var toneTimer: Timer? = null
    private var audioManager: AudioManager? = null
    private var focusRequest: AudioFocusRequest? = null
    private var previousAlarmVolume: Int = -1

    private val alarmAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    @Synchronized
    fun start(context: Context) {
        stop()
        val am = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager = am

        // 1. Audio focus so we ride over whatever is playing.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(alarmAttributes)
                .build()
                .also { runCatching { am.requestAudioFocus(it) } }
        }

        // 2. Guarantee the alarm stream is audible; remember what it was.
        runCatching {
            previousAlarmVolume = am.getStreamVolume(AudioManager.STREAM_ALARM)
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            val target = max(previousAlarmVolume, (maxVol * 3) / 4)
            if (target > previousAlarmVolume) {
                am.setStreamVolume(AudioManager.STREAM_ALARM, target, 0)
            }
        }

        // 3. Play the alarm tone, with a hard fallback to a generated siren.
        val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        if (uri != null) {
            runCatching {
                MediaPlayer().apply {
                    setDataSource(context.applicationContext, uri)
                    setAudioAttributes(alarmAttributes)
                    isLooping = true
                    prepare()
                    start()
                    player = this
                }
            }.onFailure {
                runCatching { player?.release() }
                player = null
            }
        }
        if (player == null || player?.isPlaying != true) {
            runCatching { player?.release() }
            player = null
            startToneFallback()
        }
    }

    private fun startToneFallback() {
        runCatching {
            val gen = ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME)
            toneGen = gen
            var high = true
            toneTimer = timer("crash-siren", daemon = true, period = 700L) {
                runCatching {
                    gen.startTone(
                        if (high) ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK
                        else ToneGenerator.TONE_SUP_ERROR,
                        650
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

        audioManager?.let { am ->
            if (previousAlarmVolume >= 0) {
                runCatching { am.setStreamVolume(AudioManager.STREAM_ALARM, previousAlarmVolume, 0) }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest?.let { runCatching { am.abandonAudioFocusRequest(it) } }
            }
        }
        focusRequest = null
        previousAlarmVolume = -1
        audioManager = null
    }
}
