package com.marketcrash.predictor

import android.app.Notification
import android.app.Service
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
 * Foreground sentinel that keeps polling the market feeds every few minutes so
 * a CRASH alert still fires when the app is in the background.
 */
class WatchService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var lastLevel = CrashLevel.SERENE

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopSelf()
            return START_NOT_STICKY
        }
        Notifier.ensureChannels(this)
        startInForeground(statusNotification("Sentinel arming… first sweep pending"))
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
            val snapshot = DataRepository.fetchAll()
            val assessment = CrashEngine.assess(snapshot.quotes)

            updateStatus("Crash Index ${assessment.score} · ${assessment.level.label}")
            if (assessment.level.ordinal >= CrashLevel.WARNING.ordinal &&
                assessment.level.ordinal > lastLevel.ordinal
            ) {
                Notifier.fireCrashNotification(this, assessment)
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
            .setSmallIcon(android.R.drawable.ic_menu_recent_history)
            .setContentTitle("Crash Predictor — sentinel watch")
            .setContentText(text)
            .setOngoing(true)
            .setContentIntent(Notifier.contentIntent(this))
            .build()

    override fun onDestroy() {
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        const val ACTION_STOP = "com.marketcrash.predictor.STOP_WATCH"
        const val WATCH_NOTIFICATION_ID = 87
        const val POLL_INTERVAL_MS = 5L * 60L * 1000L
        const val PREFS = "crash_predictor_prefs"
    }
}
