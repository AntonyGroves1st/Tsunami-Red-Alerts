package com.marketcrash.predictor

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Shader
import android.util.AttributeSet
import android.view.View

/**
 * A miniature price sparkline with a soft gradient fill, coloured by direction.
 * Fed from [HistoryStore]; with fewer than two points it draws a resting line.
 */
class SparklineView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null
) : View(context, attrs) {

    private var points: List<Float> = emptyList()
    private var rising = true

    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 3.5f
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.FILL
    }
    private val path = Path()
    private val fillPath = Path()

    fun setSeries(series: List<Float>, positiveChange: Boolean) {
        points = series
        rising = positiveChange
        fillPaint.shader = null
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0 || h <= 0) return

        val lineColor = if (rising) Color.parseColor("#59C08A") else Color.parseColor("#E36868")
        linePaint.color = lineColor
        if (fillPaint.shader == null) {
            fillPaint.shader = LinearGradient(
                0f, 0f, 0f, h,
                (lineColor and 0x00FFFFFF) or 0x55000000,
                (lineColor and 0x00FFFFFF),
                Shader.TileMode.CLAMP
            )
        }

        val data = if (points.size >= 2) points else listOf(0.5f, 0.5f)
        val minV = data.min()
        val maxV = data.max()
        val span = (maxV - minV).takeIf { it > 0f } ?: 1f
        val stepX = w / (data.size - 1)
        val padY = h * 0.14f

        path.reset()
        data.forEachIndexed { i, v ->
            val x = i * stepX
            val y = padY + (h - 2 * padY) * (1f - (v - minV) / span)
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        fillPath.set(path)
        fillPath.lineTo(w, h)
        fillPath.lineTo(0f, h)
        fillPath.close()

        canvas.drawPath(fillPath, fillPaint)
        canvas.drawPath(path, linePaint)
    }
}
