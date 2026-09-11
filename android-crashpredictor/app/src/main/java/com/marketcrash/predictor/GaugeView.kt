package com.marketcrash.predictor

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.SweepGradient
import android.util.AttributeSet
import android.view.View
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * The Crash Index dial: a 270° champagne-to-crimson arc with a glowing needle,
 * drawn entirely in code so the dashboard needs no image assets.
 */
class GaugeView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    /** 0–100 index value the needle points at. */
    var value: Int = 0
        set(v) {
            field = v.coerceIn(0, 100)
            invalidate()
        }

    private val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#232A3D")
    }
    private val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val needlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#F5E6C4")
    }
    private val hubPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#D4AF37")
    }
    private val tickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        color = Color.parseColor("#5A6378")
    }
    private val arcRect = RectF()

    // 270° sweep starting at 135° (7:30 position) ending at 45° (4:30).
    private val startAngle = 135f
    private val sweepAngle = 270f

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        val size = min(w, h)
        val stroke = size * 0.055f
        trackPaint.strokeWidth = stroke
        arcPaint.strokeWidth = stroke
        needlePaint.strokeWidth = stroke * 0.42f
        tickPaint.strokeWidth = stroke * 0.24f

        val cx = w / 2f
        val cy = h / 2f
        val radius = size / 2f - stroke * 1.6f
        arcRect.set(cx - radius, cy - radius, cx + radius, cy + radius)

        if (arcPaint.shader == null) {
            arcPaint.shader = SweepGradient(
                cx, cy,
                intArrayOf(
                    Color.parseColor("#2E7D5B"), // serene emerald
                    Color.parseColor("#D4AF37"), // watch gold
                    Color.parseColor("#E08A3C"), // warning amber
                    Color.parseColor("#C63B3B"), // crash crimson
                    Color.parseColor("#2E7D5B")
                ),
                floatArrayOf(0.375f, 0.55f, 0.75f, 0.95f, 1f)
            )
        }

        // Track + coloured arc up to the current value.
        canvas.drawArc(arcRect, startAngle, sweepAngle, false, trackPaint)
        canvas.drawArc(arcRect, startAngle, sweepAngle * (value / 100f), false, arcPaint)

        // Minor ticks every 10 points.
        for (i in 0..10) {
            val angle = Math.toRadians((startAngle + sweepAngle * i / 10f).toDouble())
            val inner = radius - stroke * 1.3f
            val outer = radius - stroke * 0.55f
            canvas.drawLine(
                cx + (inner * cos(angle)).toFloat(), cy + (inner * sin(angle)).toFloat(),
                cx + (outer * cos(angle)).toFloat(), cy + (outer * sin(angle)).toFloat(),
                tickPaint
            )
        }

        // Needle + gilded hub.
        val needleAngle = Math.toRadians((startAngle + sweepAngle * value / 100f).toDouble())
        val needleLen = radius - stroke * 2.1f
        canvas.drawLine(
            cx, cy,
            cx + (needleLen * cos(needleAngle)).toFloat(),
            cy + (needleLen * sin(needleAngle)).toFloat(),
            needlePaint
        )
        canvas.drawCircle(cx, cy, stroke * 0.85f, hubPaint)
    }
}
