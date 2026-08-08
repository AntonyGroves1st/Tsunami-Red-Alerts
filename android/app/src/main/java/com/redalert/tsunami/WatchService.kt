package com.redalert.tsunami

import android.app.Notification
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Foreground service that keeps polling the feeds every few minutes so a
 * RED alert still fires when the app is in the background.
 */
class WatchService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var lastLevel = AlertLevel.GREEN

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        Notifier.ensureChannels(this)
        startInForeground(statusNotification("Watching the rift… first check pending"))
        scope.launch { pollLoop() }
        return START_STICKY
    }

    private fun startInForeground(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(WATCH_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(WATCH_NOTIFICATION_ID, notification)
        }
    }

    private suspend fun pollLoop() {
        while (scope.isActive) {
            val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val regionIndex = prefs.getInt(KEY_REGION, 0).coerceIn(0, WatchRegion.ALL.size - 1)
            val region = WatchRegion.ALL[regionIndex]
            val station = prefs.getString(KEY_STATION, DEFAULT_STATION) ?: DEFAULT_STATION

            val snapshot = DataRepository.fetchAll(station)
            val assessment = AlertEngine.assess(
                region, snapshot.quakes, snapshot.tsunamiAlerts, snapshot.waterReadings, null
            )

            updateStatus("Level: ${assessment.level.label} • ${region.label}")
            if (assessment.level.ordinal >= AlertLevel.ORANGE.ordinal &&
                assessment.level.ordinal > lastLevel.ordinal
            ) {
                Notifier.fireThreatNotification(this, assessment)
            }
            lastLevel = assessment.level
            delay(POLL_INTERVAL_MS)
        }
    }

    private fun updateStatus(text: String) {
        val nm = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        nm.notify(WATCH_NOTIFICATION_ID, statusNotification(text))
    }

    private fun statusNotification(text: String): Notification =
        NotificationCompat.Builder(this, Notifier.CHANNEL_WATCH)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setContentTitle("Tsunami Red Alert — background watch")
            .setContentText(text)
            .setOngoing(true)
            .setContentIntent(Notifier.contentIntent(this))
            .build()

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "com.redalert.tsunami.STOP_WATCH"
        const val WATCH_NOTIFICATION_ID = 42
        const val POLL_INTERVAL_MS = 5L * 60L * 1000L
        const val PREFS = "tsunami_prefs"
        const val KEY_REGION = "region_index"
        const val KEY_STATION = "station_id"
        const val DEFAULT_STATION = "8443970"
    }
}
