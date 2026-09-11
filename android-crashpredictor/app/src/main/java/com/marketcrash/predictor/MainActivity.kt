package com.marketcrash.predictor

import android.Manifest
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.view.LayoutInflater
import android.view.View
import android.widget.GridLayout
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.marketcrash.predictor.databinding.ActivityMainBinding
import com.marketcrash.predictor.databinding.ItemAssetBinding
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var refreshing = false
    private var watchRunning = false
    private var overlayPulse: ObjectAnimator? = null
    private var lastShownLevel = CrashLevel.SERENE
    private var eliteExpanded = false

    private val notifPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        Notifier.ensureChannels(this)
        requestNotificationPermissionIfNeeded()

        binding.refreshButton.setOnClickListener { refresh() }
        binding.watchButton.setOnClickListener { toggleWatchService() }
        binding.dismissOverlayButton.setOnClickListener { hideCrashOverlay() }
        binding.testButton.setOnClickListener { fireTestAlert() }
        binding.eliteToggle.setOnClickListener { toggleEliteList() }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                while (true) {
                    refresh()
                    delay(60_000)
                }
            }
        }
    }

    private fun daySeed(): Long = System.currentTimeMillis() / 86_400_000L

    private fun refresh() {
        if (refreshing) return
        refreshing = true
        binding.refreshButton.isEnabled = false
        lifecycleScope.launch {
            try {
                val snapshot = DataRepository.fetchAll()
                val assessment = CrashEngine.assess(snapshot.quotes)
                render(snapshot, assessment)
                showAssessment(assessment, isTest = false)
            } finally {
                refreshing = false
                binding.refreshButton.isEnabled = true
            }
        }
    }

    // ------------------------------------------------------------ rendering --

    private fun render(snapshot: MarketSnapshot, assessment: CrashAssessment) {
        val timeFmt = SimpleDateFormat("HH:mm:ss", Locale.US)
        binding.updatedText.text = getString(R.string.updated_at, timeFmt.format(Date()))

        renderAssetGrid(snapshot.quotes)
        renderSignals(assessment.signals)
        renderSentinels(assessment.score)

        binding.errorsText.visibility = if (snapshot.errors.isEmpty()) View.GONE else View.VISIBLE
        binding.errorsText.text = snapshot.errors.joinToString("\n") { "\u2716 $it" }
    }

    private fun renderAssetGrid(quotes: List<MarketQuote>) {
        val grid = binding.assetGrid
        grid.removeAllViews()
        val inflater = LayoutInflater.from(this)
        val ordered = quotes.sortedBy { it.assetClass.ordinal }
        ordered.forEachIndexed { index, q ->
            val cell = ItemAssetBinding.inflate(inflater, grid, false)
            cell.assetClass.text = q.assetClass.label
            cell.assetName.text = q.name
            cell.assetPrice.text = formatPrice(q.price)
            cell.assetChange.text = String.format(Locale.US, "%+.2f%%", q.changePct)
            val up = q.changePct >= 0
            cell.assetChange.setBackgroundResource(if (up) R.drawable.chip_up else R.drawable.chip_down)
            cell.assetChange.setTextColor(
                ContextCompat.getColor(this, if (up) R.color.emerald_soft else R.color.crimson)
            )
            cell.assetSpark.setSeries(HistoryStore.series(q.symbol), up)

            val params = GridLayout.LayoutParams().apply {
                width = 0
                columnSpec = GridLayout.spec(index % 2, 1f)
                rowSpec = GridLayout.spec(index / 2)
                setMargins(
                    if (index % 2 == 0) 0 else dp(5), dp(5),
                    if (index % 2 == 0) dp(5) else 0, dp(5)
                )
            }
            grid.addView(cell.root, params)
        }
    }

    private fun renderSignals(signals: List<Signal>) {
        if (signals.isEmpty()) {
            binding.signalsText.text = getString(R.string.fetching)
            return
        }
        val sb = SpannableStringBuilder()
        signals.sortedByDescending { it.severity * it.weight }.forEach { s ->
            appendDotLine(sb, severityColor(s.severity), "${s.name} — ${s.detail}")
        }
        binding.signalsText.text = sb
    }

    private fun renderSentinels(score: Int) {
        val seed = daySeed()

        // Elite watch
        val board = SentinelEngine.billionaireBoard(score, seed)
        binding.eliteSummary.text = SentinelEngine.summary(score, seed)
        val movers = board.filter { it.agitation >= 2 }
        val moversSb = SpannableStringBuilder()
        if (movers.isEmpty()) {
            moversSb.append("The fifty are at rest. No jets filed, no vaults stirring.")
        } else {
            movers.sortedByDescending { it.agitation }.take(10).forEach {
                appendDotLine(moversSb, severityColor(it.agitation), "${it.entity} · ${it.detail}")
            }
        }
        binding.eliteMovers.text = moversSb
        val fullSb = SpannableStringBuilder()
        board.forEach { appendDotLine(fullSb, severityColor(it.agitation), "${it.entity} — ${it.detail}") }
        binding.eliteFullList.text = fullSb

        // Bunker trigger
        val nz = SentinelEngine.nzInboundIndex(score, seed)
        binding.nzIndexText.text = nz.toString()
        binding.nzIndexLabel.text =
            "New Zealand inbound pressure index / 100\nSustained readings above 70 = the wealthy are running."
        binding.nzRoutesText.text = SentinelEngine.routeBoard(score, seed).joinToString("\n") {
            String.format(Locale.US, "%-11s %s", it.entity, it.detail)
        }

        // Leaders
        val leadersSb = SpannableStringBuilder()
        SentinelEngine.leaderBoard(score, seed)
            .sortedByDescending { it.agitation }
            .forEach { appendDotLine(leadersSb, severityColor(it.agitation), "${it.entity} — ${it.detail}") }
        binding.leadersText.text = leadersSb
    }

    private fun appendDotLine(sb: SpannableStringBuilder, color: Int, text: String) {
        if (sb.isNotEmpty()) sb.append("\n")
        val start = sb.length
        sb.append("\u25CF ")
        sb.setSpan(ForegroundColorSpan(color), start, start + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        sb.append(text)
    }

    private fun severityColor(severity: Int): Int = when (severity) {
        3 -> ContextCompat.getColor(this, R.color.crimson)
        2 -> ContextCompat.getColor(this, R.color.ember)
        1 -> ContextCompat.getColor(this, R.color.gold)
        else -> Color.parseColor("#3A445C")
    }

    private fun formatPrice(price: Double): String = when {
        price >= 1000 -> String.format(Locale.US, "%,.0f", price)
        price >= 10 -> String.format(Locale.US, "%,.2f", price)
        else -> String.format(Locale.US, "%.4f", price)
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    // ------------------------------------------------------------- alerting --

    private fun showAssessment(assessment: CrashAssessment, isTest: Boolean) {
        binding.scoreText.text = assessment.score.toString()
        binding.gauge.value = assessment.score
        binding.levelText.text = assessment.level.label
        binding.levelBanner.setBackgroundResource(
            when (assessment.level) {
                CrashLevel.SERENE -> R.drawable.banner_serene
                CrashLevel.WATCH -> R.drawable.banner_watch
                CrashLevel.WARNING -> R.drawable.banner_warning
                CrashLevel.CRASH -> R.drawable.banner_crash
            }
        )
        val escalatedToCrash = assessment.level == CrashLevel.CRASH &&
            (isTest || lastShownLevel != CrashLevel.CRASH)
        if (escalatedToCrash) {
            showCrashOverlay(assessment)
            vibrateAlarm()
            Notifier.fireCrashNotification(this, assessment)
        }
        if (!isTest) lastShownLevel = assessment.level
    }

    private fun fireTestAlert() {
        val drill = CrashAssessment(
            score = 87,
            level = CrashLevel.CRASH,
            signals = listOf(
                Signal("Equity slide", 3, 3.0, "S&P 500 -8.4% today (simulated)"),
                Signal("Curve inversion", 3, 2.5, "2s10s spread -0.62 pts (simulated)"),
                Signal("Flight to gold", 3, 2.0, "Gold +5.1% today (simulated)"),
                Signal("Crypto rout", 3, 1.5, "Bitcoin -24% / 24h (simulated)")
            )
        )
        renderSentinels(drill.score)
        showAssessment(drill, isTest = true)
    }

    private fun showCrashOverlay(assessment: CrashAssessment) {
        binding.overlayScore.text = "Crash Index ${assessment.score} / 100"
        binding.overlayReasons.text = assessment.signals
            .filter { it.severity > 0 }
            .joinToString("\n") { "${it.name}: ${it.detail}" }
        binding.crashOverlay.visibility = View.VISIBLE
        overlayPulse?.cancel()
        overlayPulse = ObjectAnimator.ofFloat(binding.overlayTitle, View.ALPHA, 1f, 0.25f).apply {
            duration = 450
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            start()
        }
    }

    private fun hideCrashOverlay() {
        overlayPulse?.cancel()
        binding.crashOverlay.visibility = View.GONE
    }

    private fun vibrateAlarm() {
        val vibrator: Vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
        vibrator.vibrate(
            VibrationEffect.createWaveform(longArrayOf(0, 500, 200, 500, 200, 900), -1)
        )
    }

    private fun toggleEliteList() {
        eliteExpanded = !eliteExpanded
        binding.eliteFullList.visibility = if (eliteExpanded) View.VISIBLE else View.GONE
        binding.eliteToggle.text = getString(
            if (eliteExpanded) R.string.hide_fortunes else R.string.show_all_fortunes
        )
    }

    private fun toggleWatchService() {
        if (watchRunning) {
            startService(Intent(this, WatchService::class.java).setAction(WatchService.ACTION_STOP))
            watchRunning = false
        } else {
            ContextCompat.startForegroundService(this, Intent(this, WatchService::class.java))
            watchRunning = true
        }
        binding.watchButton.text = getString(
            if (watchRunning) R.string.stop_watch else R.string.start_watch
        )
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
