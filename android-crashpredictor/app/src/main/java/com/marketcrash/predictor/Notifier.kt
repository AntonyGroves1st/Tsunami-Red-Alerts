package com.marketcrash.predictor

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import androidx.core.app.NotificationCompat

object Notifier {

    // v2 channel id: channel settings freeze on creation, so adding the alarm
    // sound for users upgrading from 1.0/1.1 requires a fresh channel.
    const val CHANNEL_ALERTS = "crash_alerts_v2"
    const val CHANNEL_WATCH = "sentinel_watch"
    const val CRASH_NOTIFICATION_ID = 1929

    fun ensureChannels(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.deleteNotificationChannel("crash_alerts")
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ALERTS, "Crash alerts", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Sirens for WARNING / CRASH levels of the Crash Index"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 600, 200, 600, 200, 600)
                setSound(
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL_WATCH, "Sentinel watch", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Persistent status while the 24/7 sentinel runs" }
        )
    }

    fun contentIntent(context: Context): PendingIntent = PendingIntent.getActivity(
        context, 0,
        Intent(context, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    fun fireCrashNotification(context: Context, assessment: CrashAssessment) {
        ensureChannels(context)
        val title = when (assessment.level) {
            CrashLevel.CRASH -> "\uD83D\uDEA8 GLOBAL CRASH ALERT — index ${assessment.score}"
            CrashLevel.WARNING -> "\u26A0 Market stress warning — index ${assessment.score}"
            else -> "Crash watch update — index ${assessment.score}"
        }
        val body = assessment.signals
            .filter { it.severity > 0 }
            .joinToString("\n") { "${it.name}: ${it.detail}" }
            .ifEmpty { "All tracked signals calm." }
        val notification = NotificationCompat.Builder(context, CHANNEL_ALERTS)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle(title)
            .setContentText(assessment.level.label)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(contentIntent(context))
            .build()
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(CRASH_NOTIFICATION_ID, notification)
    }
}
