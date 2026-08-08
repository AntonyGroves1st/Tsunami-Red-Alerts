package com.worldfootball.app.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Infinite left-to-right shimmer used for loading placeholders. */
@Composable
fun rememberShimmerBrush(): Brush {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val x by transition.animateFloat(
        initialValue = -600f,
        targetValue = 900f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerX"
    )
    val colors = listOf(
        Color(0x14FFFFFF),
        Color(0x40B6FF3B),
        Color(0x14FFFFFF)
    )
    return Brush.linearGradient(
        colors = colors,
        start = Offset(x, 0f),
        end = Offset(x + 400f, 200f)
    )
}

@Composable
fun ShimmerLine(modifier: Modifier = Modifier, height: Int = 16) {
    Box(
        modifier = modifier
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(rememberShimmerBrush())
            .height(height.dp)
    )
}

@Composable
fun ShimmerCard(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(96.dp)
            .clip(RoundedCornerShape(20.dp))
            .background(rememberShimmerBrush())
    )
}
