package com.redalert.tsunami

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

object Notifier {

    const val CHANNEL_ALERTS = "red_alerts"
    const val CHANNEL_WATCH = "watch_service"
    const val RED_ALERT_NOTIFICATION_ID = 911

    fun ensureChannels(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ALERTS, "Tsunami red alerts", NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Sirens for RED / ORANGE threat levels"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 600, 200, 600, 200, 600)
            }
        )
        nm.createNotificationChannel(
            NotificationChannel(
                CHANNEL_WATCH, "Background watch", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Persistent status while the watch service runs" }
        )
    }

    fun contentIntent(context: Context): PendingIntent = PendingIntent.getActivity(
        context, 0,
        Intent(context, MainActivity::class.java),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    fun fireThreatNotification(context: Context, assessment: Assessment) {
        ensureChannels(context)
        val title = when (assessment.level) {
            AlertLevel.RED -> "\uD83D\uDEA8 TSUNAMI RED ALERT"
            AlertLevel.ORANGE -> "\u26A0 Tsunami watch — threat elevated"
            else -> "Tsunami watch update"
        }
        val body = assessment.reasons.joinToString("\n")
        val notification = NotificationCompat.Builder(context, CHANNEL_ALERTS)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle(title)
            .setContentText(assessment.reasons.firstOrNull() ?: assessment.level.label)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(contentIntent(context))
            .build()
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(RED_ALERT_NOTIFICATION_ID, notification)
    }
}
