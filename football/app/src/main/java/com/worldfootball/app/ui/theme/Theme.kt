package com.worldfootball.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val FootballColors = darkColorScheme(
    primary = NeonLime,
    onPrimary = PitchNight,
    secondary = ElectricCyan,
    onSecondary = PitchNight,
    tertiary = Gold,
    background = PitchNight,
    onBackground = TextHigh,
    surface = PitchDeep,
    onSurface = TextHigh,
    surfaceVariant = PitchGreen,
    onSurfaceVariant = TextMid,
    error = AlertRed,
    outline = PitchLine
)

@Composable
fun WorldFootballTheme(
    @Suppress("UNUSED_PARAMETER") darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = FootballColors,
        typography = FootballTypography,
        content = content
    )
}
