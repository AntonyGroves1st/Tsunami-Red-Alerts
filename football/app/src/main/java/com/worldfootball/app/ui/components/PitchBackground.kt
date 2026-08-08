package com.worldfootball.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.worldfootball.app.ui.theme.ElectricCyan
import com.worldfootball.app.ui.theme.NeonLime
import com.worldfootball.app.ui.theme.PitchDeep
import com.worldfootball.app.ui.theme.PitchGreen
import com.worldfootball.app.ui.theme.PitchNight

/**
 * Full-screen animated pitch: mown stripes, a soft roaming spotlight and a
 * faint centre circle. Vector-drawn so it stays crisp at any resolution/DPI.
 */
@Composable
fun PitchBackground(modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "pitch")
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(9000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sweep"
    )
    val pulse by transition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Canvas(modifier = modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height

        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(PitchGreen, PitchDeep, PitchNight)
            ),
            size = Size(w, h)
        )

        val stripes = 8
        val stripeH = h / stripes
        for (i in 0 until stripes) {
            if (i % 2 == 0) {
                drawRect(
                    color = Color.White.copy(alpha = 0.025f),
                    topLeft = Offset(0f, i * stripeH),
                    size = Size(w, stripeH)
                )
            }
        }

        // Roaming stadium spotlight.
        val cx = w * (0.2f + 0.6f * sweep)
        val cy = h * 0.28f
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(NeonLime.copy(alpha = 0.16f), Color.Transparent),
                center = Offset(cx, cy),
                radius = w * 0.7f * pulse
            ),
            radius = w * 0.7f * pulse,
            center = Offset(cx, cy)
        )
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(ElectricCyan.copy(alpha = 0.10f), Color.Transparent),
                center = Offset(w * 0.85f, h * 0.8f),
                radius = w * 0.6f
            ),
            radius = w * 0.6f,
            center = Offset(w * 0.85f, h * 0.8f)
        )

        // Centre circle + halfway line.
        drawLine(
            color = Color.White.copy(alpha = 0.05f),
            start = Offset(0f, h / 2f),
            end = Offset(w, h / 2f),
            strokeWidth = 2f
        )
        drawCircle(
            color = Color.White.copy(alpha = 0.06f),
            radius = w * 0.16f,
            center = Offset(w / 2f, h / 2f),
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f)
        )
    }
}
