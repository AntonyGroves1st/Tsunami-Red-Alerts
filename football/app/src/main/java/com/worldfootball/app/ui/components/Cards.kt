package com.worldfootball.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Air
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.worldfootball.app.data.model.BigStat
import com.worldfootball.app.data.model.Match
import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.data.model.NewsItem
import com.worldfootball.app.data.model.Player
import com.worldfootball.app.data.model.Wag
import com.worldfootball.app.data.model.WeatherNow
import com.worldfootball.app.data.model.WeatherSeverity
import com.worldfootball.app.ui.theme.AlertRed
import com.worldfootball.app.ui.theme.ElectricCyan
import com.worldfootball.app.ui.theme.Gold
import com.worldfootball.app.ui.theme.HotMagenta
import com.worldfootball.app.ui.theme.NeonLime
import com.worldfootball.app.ui.theme.TextDim
import com.worldfootball.app.ui.theme.TextHigh
import com.worldfootball.app.ui.theme.TextMid
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
private fun TapHint(accent: Color, label: String = "TAP FOR DETAILS  ›") {
    Spacer(Modifier.height(10.dp))
    Text(label, color = accent, style = MaterialTheme.typography.labelSmall)
}

private fun categoryColor(c: NewsCategory): Color = when (c) {
    NewsCategory.TRANSFER -> ElectricCyan
    NewsCategory.INJURY -> AlertRed
    NewsCategory.MANAGER -> Gold
    NewsCategory.MEMORIAM -> TextMid
    NewsCategory.BREAKING -> HotMagenta
    NewsCategory.RESULT -> NeonLime
    NewsCategory.GENERAL -> NeonLime
}

private val timeFmt = SimpleDateFormat("EEE d MMM · HH:mm", Locale.ENGLISH)
private val clockFmt = SimpleDateFormat("HH:mm", Locale.ENGLISH)

private fun relative(epochMs: Long): String {
    val diff = System.currentTimeMillis() - epochMs
    val mins = diff / 60000
    return when {
        mins < 1 -> "just now"
        mins < 60 -> "${mins}m ago"
        mins < 1440 -> "${mins / 60}h ago"
        else -> "${mins / 1440}d ago"
    }
}

@Composable
fun NewsCard(item: NewsItem, breaking: Boolean = false, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = categoryColor(item.category)
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (breaking) {
                    PulseBadge("BREAKING", HotMagenta)
                    Spacer(Modifier.width(8.dp))
                }
                Box(
                    Modifier
                        .clip(RoundedCornerShape(50))
                        .background(accent.copy(alpha = 0.16f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(item.category.label.uppercase(), color = accent, style = MaterialTheme.typography.labelSmall)
                }
                Spacer(Modifier.weight(1f))
                Text(relative(item.publishedEpochMs), color = TextDim, style = MaterialTheme.typography.labelSmall)
            }
            Spacer(Modifier.height(10.dp))
            Text(
                item.title,
                color = TextHigh,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            if (item.summary.isNotBlank()) {
                Spacer(Modifier.height(6.dp))
                Text(
                    item.summary,
                    color = TextMid,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(item.source.uppercase(), color = accent, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun Badge(url: String?, fallback: String) {
    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(40.dp)) {
        if (url != null) {
            AsyncImage(
                model = url,
                contentDescription = null,
                modifier = Modifier.size(40.dp).clip(CircleShape)
            )
        } else {
            Box(
                Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(Brush.verticalGradient(listOf(NeonLime.copy(alpha = 0.5f), ElectricCyan.copy(alpha = 0.3f)))),
                contentAlignment = Alignment.Center
            ) {
                Text(fallback.take(3).uppercase(), color = TextHigh, style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
fun MatchCard(match: Match, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = if (match.isFinished) NeonLime else ElectricCyan
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (match.leagueBadge != null) {
                    AsyncImage(model = match.leagueBadge, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                }
                Text(match.league.uppercase(), color = TextDim, style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                if (match.isFinished) {
                    Text("FT", color = NeonLime, style = MaterialTheme.typography.labelSmall)
                } else {
                    val ko = match.kickoffEpochMs
                    Text(if (ko != null) timeFmt.format(Date(ko)) else "TBD", color = ElectricCyan, style = MaterialTheme.typography.labelSmall)
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Badge(match.homeBadge, match.homeTeam)
                    Spacer(Modifier.height(6.dp))
                    Text(match.homeTeam, color = TextHigh, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 12.dp)) {
                    Text(
                        match.scoreLine,
                        color = if (match.isFinished) NeonLime else TextMid,
                        fontWeight = FontWeight.Black,
                        style = MaterialTheme.typography.headlineMedium
                    )
                }
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Badge(match.awayBadge, match.awayTeam)
                    Spacer(Modifier.height(6.dp))
                    Text(match.awayTeam, color = TextHigh, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

@Composable
private fun PlayerPortrait(url: String?, name: String, accent: Color) {
    Box(
        modifier = Modifier
            .size(52.dp)
            .clip(CircleShape)
            .background(Brush.verticalGradient(listOf(accent.copy(alpha = 0.55f), accent.copy(alpha = 0.15f)))),
        contentAlignment = Alignment.Center
    ) {
        if (url != null) {
            AsyncImage(
                model = url,
                contentDescription = name,
                modifier = Modifier.size(52.dp).clip(CircleShape)
            )
        } else {
            Text(
                name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""),
                color = TextHigh,
                fontWeight = FontWeight.Black,
                style = MaterialTheme.typography.titleMedium
            )
        }
    }
}

@Composable
fun PlayerCard(player: Player, rank: Int, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = Color(player.accent)
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("#$rank", color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                Spacer(Modifier.width(10.dp))
                PlayerPortrait(player.imageUrl, player.name, accent)
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(player.name, color = TextHigh, style = MaterialTheme.typography.titleLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("${player.country} · ${player.position} · ${player.club}", color = TextMid, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                RatingBadge(player.rating, accent)
            }
            Spacer(Modifier.height(10.dp))
            Text(player.headline, color = TextMid, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                player.stats.forEach { s ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(s.value, color = accent, style = MaterialTheme.typography.titleMedium)
                        Text(s.label, color = TextDim, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
            TapHint(accent, "TAP FOR FULL PROFILE  ›")
        }
    }
}

@Composable
fun WagCard(wag: Wag, rank: Int, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = Color(wag.accent)
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Brush.verticalGradient(listOf(accent, accent.copy(alpha = 0.5f)))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(wag.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""), color = Color(0xFF04140D), fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("#$rank  ${wag.name}", color = TextHigh, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text("with ${wag.partner}", color = TextDim, style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
                RatingBadge(wag.overall, accent)
            }
            Spacer(Modifier.height(10.dp))
            Text(wag.brains, color = TextMid, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(12.dp))
            StatBar("Looks", "${wag.looksScore}", wag.looksScore / 100f, HotMagenta)
            Spacer(Modifier.height(8.dp))
            StatBar("Brains", "${wag.brainsScore}", wag.brainsScore / 100f, ElectricCyan)
            TapHint(accent, "TAP FOR FULL PROFILE  ›")
        }
    }
}

@Composable
fun WeatherCard(w: WeatherNow, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = when (w.severity) {
        WeatherSeverity.CLEAR -> NeonLime
        WeatherSeverity.ROUGH -> Gold
        WeatherSeverity.SEVERE -> AlertRed
    }
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(w.venue, color = TextHigh, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(w.city, color = TextDim, style = MaterialTheme.typography.labelSmall)
                }
                Box(
                    Modifier
                        .clip(RoundedCornerShape(50))
                        .background(accent.copy(alpha = 0.16f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(w.severity.label.uppercase(), color = accent, style = MaterialTheme.typography.labelSmall)
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                WeatherStat(Icons.Filled.Thermostat, "${w.temperatureC.toInt()}°C")
                WeatherStat(Icons.Filled.WaterDrop, "${w.precipitationMm} mm")
                WeatherStat(Icons.Filled.Air, "${w.windKph.toInt()} kph")
                WeatherStat(Icons.Filled.Bolt, w.condition)
            }
            TapHint(accent)
        }
    }
}

@Composable
private fun WeatherStat(icon: androidx.compose.ui.graphics.vector.ImageVector, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, contentDescription = null, tint = ElectricCyan, modifier = Modifier.size(20.dp))
        Spacer(Modifier.height(4.dp))
        Text(value, color = TextHigh, style = MaterialTheme.typography.labelSmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
fun BigStatCard(stat: BigStat, onClick: (() -> Unit)? = null, modifier: Modifier = Modifier) {
    val accent = Color(stat.accent)
    GradientCard(modifier = modifier.fillMaxWidth(), accent = accent, onClick = onClick) {
        Column {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(stat.value, color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.displayLarge)
                Spacer(Modifier.width(12.dp))
                Text(stat.headline, color = TextHigh, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f).padding(bottom = 6.dp))
            }
            Spacer(Modifier.height(6.dp))
            Text(stat.detail, color = TextMid, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(12.dp))
            StatBar("Record strength", "${(stat.progress * 100).toInt()}%", stat.progress, accent)
            TapHint(accent)
        }
    }
}
