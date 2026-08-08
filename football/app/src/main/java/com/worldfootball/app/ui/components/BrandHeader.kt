package com.worldfootball.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SportsSoccer
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.worldfootball.app.ui.theme.ElectricCyan
import com.worldfootball.app.ui.theme.Gold
import com.worldfootball.app.ui.theme.NeonLime
import com.worldfootball.app.ui.theme.TextDim

/** Big animated wordmark with a spinning ball and a sweeping gradient. */
@Composable
fun BrandHeader(modifier: Modifier = Modifier, subtitle: String) {
    val transition = rememberInfiniteTransition(label = "brand")
    val spin by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(6000, easing = LinearEasing), RepeatMode.Restart),
        label = "spin"
    )
    val shift by transition.animateFloat(
        initialValue = 0f,
        targetValue = 600f,
        animationSpec = infiniteRepeatable(tween(3500, easing = LinearEasing), RepeatMode.Reverse),
        label = "shift"
    )
    val brandBrush = Brush.linearGradient(
        colors = listOf(NeonLime, ElectricCyan, Gold, NeonLime),
        start = Offset(shift, 0f),
        end = Offset(shift + 500f, 120f)
    )

    Column(modifier.fillMaxWidth().padding(horizontal = 20.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = Icons.Filled.SportsSoccer,
                contentDescription = null,
                tint = NeonLime,
                modifier = Modifier
                    .size(34.dp)
                    .rotate(spin)
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = "WORLD FOOTBALL",
                style = MaterialTheme.typography.displayLarge.copy(brush = brandBrush)
            )
        }
        Text(
            text = subtitle,
            color = TextDim,
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(start = 44.dp)
        )
    }
}

@Composable
fun EmptyHint(text: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = text,
            color = TextDim,
            textAlign = TextAlign.Center,
            style = MaterialTheme.typography.bodyLarge
        )
    }
}
