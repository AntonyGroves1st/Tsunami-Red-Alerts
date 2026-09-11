package com.redalert.tsunami

import android.Manifest
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.format.DateUtils
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.redalert.tsunami.databinding.ActivityMainBinding
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity(), SensorEventListener {

    private lateinit var binding: ActivityMainBinding
    private var sensorManager: SensorManager? = null
    private var pressureSensor: Sensor? = null

    /** (elapsed wall-clock ms, hPa) samples from the device barometer. */
    private val pressureSamples = ArrayDeque<Pair<Long, Float>>()
    private var refreshing = false
    private var watchRunning = false
    private var overlayPulse: ObjectAnimator? = null
    private var screenFlash: ObjectAnimator? = null
    private var scanningPulse: ObjectAnimator? = null
    private var activeFooterIndex = -1
    private var lastShownLevel = AlertLevel.GREEN
    private lateinit var alarmSiren: AlarmSiren
    private var alarmVibrator: Vibrator? = null

    companion object {
        const val EXTRA_TEST_ALERT = "test_alert"
    }

    private val notifPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        Notifier.ensureChannels(this)
        requestNotificationPermissionIfNeeded()

        val prefs = getSharedPreferences(WatchService.PREFS, Context.MODE_PRIVATE)

        binding.regionSpinner.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item,
            WatchRegion.ALL.map { it.label }
        )
        binding.regionSpinner.setSelection(
            prefs.getInt(WatchService.KEY_REGION, 0).coerceIn(0, WatchRegion.ALL.size - 1)
        )
        binding.regionSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                prefs.edit().putInt(WatchService.KEY_REGION, position).apply()
                refresh()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }

        binding.stationInput.setText(
            prefs.getString(WatchService.KEY_STATION, WatchService.DEFAULT_STATION)
        )

        binding.refreshButton.setOnClickListener { refresh() }
        binding.testButton.setOnClickListener {
            showAssessment(
                Assessment(
                    AlertLevel.RED,
                    listOf(
                        "TEST ALERT — this is a drill",
                        "M8.2 MEGAQUAKE — Mid-Atlantic Ridge (simulated)",
                        "WATER SURGING: +40 cm in 6 min at tide station (simulated)"
                    )
                ),
                isTest = true
            )
        }
        binding.watchButton.setOnClickListener { toggleWatchService() }
        binding.dismissOverlayButton.setOnClickListener { hideRedOverlay() }

        binding.footerStatus.setOnClickListener { binding.scrollView.smoothScrollTo(0, 0); setActiveFooter(0) }
        binding.footerQuakes.setOnClickListener { scrollToSection(binding.labelQuakes); setActiveFooter(1) }
        binding.footerBuoys.setOnClickListener { scrollToSection(binding.labelBuoys); setActiveFooter(2) }
        binding.footerWater.setOnClickListener { scrollToSection(binding.labelWater); setActiveFooter(3) }
        binding.footerPressure.setOnClickListener { scrollToSection(binding.labelPressure); setActiveFooter(4) }

        // Scroll-spy: highlight the footer item for whichever section is at the top.
        binding.scrollView.setOnScrollChangeListener { _, _, scrollY, _, _ ->
            val probe = scrollY + (120 * resources.displayMetrics.density).toInt()
            val tops = intArrayOf(
                0, binding.labelQuakes.top, binding.labelBuoys.top,
                binding.labelWater.top, binding.labelPressure.top
            )
            var active = 0
            for (i in tops.indices) if (probe >= tops[i]) active = i
            setActiveFooter(active)
        }
        setActiveFooter(0)

        // Reflect any already-running background watch (e.g. after reopening the app).
        watchRunning = WatchService.isRunning
        updateWatchUi()

        alarmSiren = AlarmSiren(this)

        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        pressureSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_PRESSURE)
        if (pressureSensor == null) {
            binding.pressureText.text = getString(R.string.no_barometer)
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                while (true) {
                    refresh()
                    delay(60_000)
                }
            }
        }

        // Drill support: `adb shell am start ... --ez test_alert true` fires the alarm.
        if (intent.getBooleanExtra(EXTRA_TEST_ALERT, false)) {
            binding.testButton.postDelayed({ binding.testButton.performClick() }, 1500)
        }
    }

    override fun onResume() {
        super.onResume()
        pressureSensor?.let {
            sensorManager?.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL)
        }
    }

    override fun onPause() {
        sensorManager?.unregisterListener(this)
        super.onPause()
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_PRESSURE) return
        val now = System.currentTimeMillis()
        pressureSamples.addLast(now to event.values[0])
        while (pressureSamples.isNotEmpty() && now - pressureSamples.first().first > 3 * 60 * 60 * 1000L) {
            pressureSamples.removeFirst()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    /** hPa per hour over the sampled window; null until we have >= 10 minutes of data. */
    private fun pressureTrendHpaPerHr(): Double? {
        val first = pressureSamples.firstOrNull() ?: return null
        val last = pressureSamples.lastOrNull() ?: return null
        val spanMs = last.first - first.first
        if (spanMs < 10 * 60 * 1000L) return null
        return (last.second - first.second) / (spanMs / 3_600_000.0)
    }

    private fun refresh() {
        if (refreshing) return
        refreshing = true
        binding.refreshButton.isEnabled = false
        val station = binding.stationInput.text.toString().trim()
        getSharedPreferences(WatchService.PREFS, Context.MODE_PRIVATE)
            .edit().putString(WatchService.KEY_STATION, station).apply()
        val region = WatchRegion.ALL[
            binding.regionSpinner.selectedItemPosition.coerceIn(0, WatchRegion.ALL.size - 1)
        ]

        lifecycleScope.launch {
            try {
                val snapshot = DataRepository.fetchAll(station)
                val assessment = AlertEngine.assess(
                    region, snapshot.quakes, snapshot.tsunamiAlerts,
                    snapshot.waterReadings, pressureTrendHpaPerHr(), snapshot.buoys
                )
                render(region, snapshot)
                showAssessment(assessment, isTest = false)
            } finally {
                refreshing = false
                binding.refreshButton.isEnabled = true
            }
        }
    }

    private fun render(region: WatchRegion, snapshot: Snapshot) {
        val timeFmt = SimpleDateFormat("HH:mm:ss", Locale.US)
        binding.updatedText.text = getString(R.string.updated_at, timeFmt.format(Date()))

        binding.alertsText.text =
            if (snapshot.tsunamiAlerts.isEmpty()) getString(R.string.no_tsunami_alerts)
            else snapshot.tsunamiAlerts.joinToString("\n\n") {
                "\u26A0 ${it.event} [${it.severity}]\n${it.headline}\nAreas: ${it.area}"
            }

        val topQuakes = snapshot.quakes.take(12)
        binding.quakesText.text =
            if (topQuakes.isEmpty()) getString(R.string.no_quakes)
            else topQuakes.joinToString("\n") { q ->
                val marker = if (region.contains(q.lat, q.lon)) "\u25B6 " else "   "
                val ago = DateUtils.getRelativeTimeSpanString(q.timeMs)
                String.format(Locale.US, "%sM%.1f  %s\n     %s • depth %.0f km", marker, q.magnitude, q.place, ago, q.depthKm)
            }

        val buoys = snapshot.buoys
        binding.buoysText.text = if (buoys.isEmpty()) {
            getString(R.string.no_buoys)
        } else {
            val inZone = buoys.filter { region.contains(it.lat, it.lon) }
            val topSeas = inZone.filter { it.waveHeightM != null }
                .sortedByDescending { it.waveHeightM!! }.take(5)
            val minPressure = inZone.filter { it.pressureHpa != null }
                .minByOrNull { it.pressureHpa!! }
            buildString {
                append("Buoys reporting worldwide: ${buoys.size}\n")
                append("In watch zone: ${inZone.size}")
                minPressure?.let {
                    append(String.format(Locale.US, "\nLowest pressure in zone: %.0f hPa @ buoy %s", it.pressureHpa, it.id))
                }
                if (topSeas.isNotEmpty()) {
                    append("\n\nHighest seas in zone:")
                    for (b in topSeas) {
                        append(String.format(Locale.US, "\n  %s  %.1f m  (%.1f, %.1f)", b.id, b.waveHeightM, b.lat, b.lon))
                    }
                }
            }
        }

        val readings = snapshot.waterReadings
        binding.waterText.text = if (readings.isEmpty()) {
            getString(R.string.no_water_data)
        } else {
            val latest = readings.maxBy { it.timeMs }
            val oldest = readings.minBy { it.timeMs }
            val netCm = (latest.meters - oldest.meters) * 100.0
            val maxRise = AlertEngine.maxSixMinRiseCm(readings) ?: 0.0
            String.format(
                Locale.US,
                "Station %s\nCurrent level: %.2f m (MLLW)\nNet change last 2 h: %+.0f cm\nFastest 6-min rise: %+.0f cm",
                binding.stationInput.text.toString().trim(), latest.meters, netCm, maxRise
            )
        }

        if (pressureSensor != null) {
            val current = pressureSamples.lastOrNull()?.second
            val trend = pressureTrendHpaPerHr()
            binding.pressureText.text = when {
                current == null -> getString(R.string.pressure_waiting)
                trend == null -> String.format(Locale.US, "Current: %.1f hPa\nTrend: collecting data…", current)
                else -> String.format(Locale.US, "Current: %.1f hPa\nTrend: %+.2f hPa/hr", current, trend)
            }
        }

        binding.errorsText.visibility = if (snapshot.errors.isEmpty()) View.GONE else View.VISIBLE
        binding.errorsText.text = snapshot.errors.joinToString("\n") { "\u2716 $it" }
    }

    private fun showAssessment(assessment: Assessment, isTest: Boolean) {
        binding.levelText.text = assessment.level.label
        binding.reasonsText.text = assessment.reasons.joinToString("\n") { "\u2022 $it" }
        binding.banner.setBackgroundResource(
            when (assessment.level) {
                AlertLevel.GREEN -> R.drawable.banner_green
                AlertLevel.YELLOW -> R.drawable.banner_yellow
                AlertLevel.ORANGE -> R.drawable.banner_orange
                AlertLevel.RED -> R.drawable.banner_red
            }
        )
        val escalatedToRed = assessment.level == AlertLevel.RED &&
            (isTest || lastShownLevel != AlertLevel.RED)
        if (escalatedToRed) {
            showRedOverlay(assessment)
            Notifier.fireThreatNotification(this, assessment)
        }
        if (!isTest) lastShownLevel = assessment.level
    }

    /** Full alarm experience: overlay + flashing screen + looping siren + looping vibration. */
    private fun showRedOverlay(assessment: Assessment) {
        binding.overlayReasons.text = assessment.reasons.joinToString("\n")
        binding.redOverlay.visibility = View.VISIBLE

        overlayPulse?.cancel()
        overlayPulse = ObjectAnimator.ofFloat(binding.overlayTitle, View.ALPHA, 1f, 0.25f).apply {
            duration = 450
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            start()
        }

        screenFlash?.cancel()
        screenFlash = ObjectAnimator.ofFloat(binding.flashView, View.ALPHA, 0f, 0.5f).apply {
            duration = 300
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            start()
        }

        alarmSiren.start()
        startAlarmVibration()
    }

    private fun hideRedOverlay() {
        overlayPulse?.cancel()
        screenFlash?.cancel()
        binding.flashView.alpha = 0f
        binding.redOverlay.visibility = View.GONE
        alarmSiren.stop()
        alarmVibrator?.cancel()
        alarmVibrator = null
    }

    /** Repeating vibration pattern that loops in step with the siren until dismissed. */
    private fun startAlarmVibration() {
        val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        alarmVibrator = vibrator
        vibrator.vibrate(
            VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500, 200, 600), 0)
        )
    }

    override fun onDestroy() {
        hideRedOverlay()
        stopScanningPulse()
        super.onDestroy()
    }

    private fun toggleWatchService() {
        if (watchRunning) {
            startService(Intent(this, WatchService::class.java).setAction(WatchService.ACTION_STOP))
            watchRunning = false
        } else {
            ContextCompat.startForegroundService(this, Intent(this, WatchService::class.java))
            watchRunning = true
        }
        updateWatchUi()
    }

    /** Smooth-scroll the main content so the given section header sits near the top. */
    private fun scrollToSection(target: View) {
        binding.scrollView.smoothScrollTo(0, target.top)
    }

    /** Highlight the active footer item: show its indicator bar, accent + bold its
     * glyph, and brighten its label; mute the rest. Child order per item is
     * [indicator, glyph, label]. */
    private fun setActiveFooter(index: Int) {
        if (index == activeFooterIndex) return
        activeFooterIndex = index
        val items = listOf(
            binding.footerStatus, binding.footerQuakes, binding.footerBuoys,
            binding.footerWater, binding.footerPressure
        )
        items.forEachIndexed { i, item ->
            val active = i == index
            item.getChildAt(0)?.visibility = if (active) View.VISIBLE else View.INVISIBLE
            (item.getChildAt(1) as? TextView)?.apply {
                setTextColor(ContextCompat.getColor(this@MainActivity, if (active) R.color.scan else R.color.text_secondary))
                setTypeface(null, if (active) Typeface.BOLD else Typeface.NORMAL)
                if (active) {
                    // Quick pop so the newly selected item feels responsive.
                    scaleX = 1.25f
                    scaleY = 1.25f
                    animate().scaleX(1f).scaleY(1f).setDuration(180).start()
                }
            }
            (item.getChildAt(2) as? TextView)?.setTextColor(
                ContextCompat.getColor(this, if (active) R.color.text_primary else R.color.text_secondary)
            )
        }
    }

    /** Sync the watch button label and the top "SCANNING" indicator to the watch state. */
    private fun updateWatchUi() {
        binding.watchButton.text = getString(
            if (watchRunning) R.string.stop_watch else R.string.start_watch
        )
        if (watchRunning) {
            binding.scanningIndicator.visibility = View.VISIBLE
            startScanningPulse()
        } else {
            stopScanningPulse()
            binding.scanningIndicator.visibility = View.GONE
        }
    }

    /** Gentle breathing pulse on the scanning dot to signal the watch is live. */
    private fun startScanningPulse() {
        if (scanningPulse?.isRunning == true) return
        scanningPulse = ObjectAnimator.ofFloat(binding.scanningDot, View.ALPHA, 1f, 0.2f).apply {
            duration = 850
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            start()
        }
    }

    private fun stopScanningPulse() {
        scanningPulse?.cancel()
        scanningPulse = null
        binding.scanningDot.alpha = 1f
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
