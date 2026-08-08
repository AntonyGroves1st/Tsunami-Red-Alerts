package com.worldfootball.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.worldfootball.app.data.model.BigStat
import com.worldfootball.app.data.model.Match
import com.worldfootball.app.data.model.NewsItem
import com.worldfootball.app.data.model.Player
import com.worldfootball.app.data.model.Wag
import com.worldfootball.app.data.model.WeatherNow
import com.worldfootball.app.data.model.WeatherSeverity
import com.worldfootball.app.ui.components.GradientCard
import com.worldfootball.app.ui.components.PitchBackground
import com.worldfootball.app.ui.components.RatingBadge
import com.worldfootball.app.ui.components.StatBar
import com.worldfootball.app.ui.theme.ElectricCyan
import com.worldfootball.app.ui.theme.Gold
import com.worldfootball.app.ui.theme.HotMagenta
import com.worldfootball.app.ui.theme.NeonLime
import com.worldfootball.app.ui.theme.PitchNight
import com.worldfootball.app.ui.theme.TextDim
import com.worldfootball.app.ui.theme.TextHigh
import com.worldfootball.app.ui.theme.TextMid
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** What the detail overlay should show. */
sealed interface DetailTarget {
    data class PlayerDetail(val player: Player, val rank: Int, val heading: String) : DetailTarget
    data class WagDetail(val wag: Wag, val rank: Int) : DetailTarget
    data class MatchDetail(val match: Match) : DetailTarget
    data class NewsDetail(val item: NewsItem) : DetailTarget
    data class WeatherDetail(val weather: WeatherNow) : DetailTarget
    data class StatDetail(val stat: BigStat) : DetailTarget
}

private val fullDateFmt = SimpleDateFormat("EEEE d MMMM yyyy · HH:mm", Locale.ENGLISH)

@Composable
fun DetailScreen(
    target: DetailTarget,
    onClose: () -> Unit,
    onOpenLink: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val title = when (target) {
        is DetailTarget.PlayerDetail -> target.heading
        is DetailTarget.WagDetail -> "Profile"
        is DetailTarget.MatchDetail -> "Match Centre"
        is DetailTarget.NewsDetail -> target.item.category.label
        is DetailTarget.WeatherDetail -> "Match-day Weather"
        is DetailTarget.StatDetail -> "Big Stat"
    }
    Box(modifier.fillMaxSize().background(PitchNight)) {
        PitchBackground()
        Column(
            Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(8.dp)) {
                IconButton(onClick = onClose) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = NeonLime)
                }
                Text(title.uppercase(), color = TextHigh, style = MaterialTheme.typography.labelLarge)
            }
            Column(
                Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(start = 16.dp, end = 16.dp, bottom = 40.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                when (target) {
                    is DetailTarget.PlayerDetail -> PlayerDetail(target.player, target.rank)
                    is DetailTarget.WagDetail -> WagDetail(target.wag, target.rank)
                    is DetailTarget.MatchDetail -> MatchDetail(target.match)
                    is DetailTarget.NewsDetail -> NewsDetail(target.item, onOpenLink)
                    is DetailTarget.WeatherDetail -> WeatherDetail(target.weather)
                    is DetailTarget.StatDetail -> StatDetail(target.stat)
                }
            }
        }
    }
}

@Composable
private fun SubHeader(text: String, accent: Color) {
    Text(text.uppercase(), color = accent, style = MaterialTheme.typography.labelLarge)
}

@Composable
private fun Bullets(items: List<String>, accent: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        items.forEach {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    Modifier.padding(top = 7.dp).size(6.dp).clip(CircleShape).background(accent)
                )
                Spacer(Modifier.width(10.dp))
                Text(it, color = TextMid, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
private fun Chips(items: List<String>, accent: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        items.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { t ->
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(50))
                            .background(accent.copy(alpha = 0.16f))
                            .padding(horizontal = 14.dp, vertical = 8.dp)
                    ) { Text(t, color = accent, style = MaterialTheme.typography.labelLarge) }
                }
            }
        }
    }
}

@Composable
private fun PlayerDetail(player: Player, rank: Int) {
    val accent = Color(player.accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(96.dp).clip(RoundedCornerShape(20.dp))
                        .background(Brush.verticalGradient(listOf(accent.copy(alpha = 0.6f), accent.copy(alpha = 0.15f)))),
                    contentAlignment = Alignment.Center
                ) {
                    if (player.imageUrl != null) {
                        AsyncImage(model = player.imageUrl, contentDescription = player.name, modifier = Modifier.size(96.dp).clip(RoundedCornerShape(20.dp)))
                    } else {
                        Text(player.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""), color = TextHigh, fontWeight = FontWeight.Black, style = MaterialTheme.typography.headlineMedium)
                    }
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text("#$rank", color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelLarge)
                    Text(player.name, color = TextHigh, style = MaterialTheme.typography.headlineMedium)
                    Text("${player.country} · ${player.position}", color = TextMid, style = MaterialTheme.typography.bodyLarge)
                    if (player.era.isNotBlank()) Text(player.era, color = TextDim, style = MaterialTheme.typography.labelSmall)
                }
                RatingBadge(player.rating, accent)
            }
        }
    }
    if (player.bio.isNotBlank()) {
        SubHeader("Story", accent)
        Text(player.bio, color = TextMid, style = MaterialTheme.typography.bodyLarge)
    }
    if (player.stats.isNotEmpty()) {
        SubHeader("Key numbers", accent)
        GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                player.stats.forEach { s ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(s.value, color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                        Text(s.label, color = TextDim, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }
    }
    if (player.traits.isNotEmpty()) {
        SubHeader("Signature traits", accent)
        Chips(player.traits, accent)
    }
    if (player.honours.isNotEmpty()) {
        SubHeader("Honours & landmarks", accent)
        Bullets(player.honours, accent)
    }
    Text("Club: ${player.club}", color = TextDim, style = MaterialTheme.typography.bodyMedium)
}

@Composable
private fun WagDetail(wag: Wag, rank: Int) {
    val accent = Color(wag.accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(80.dp).clip(CircleShape)
                        .background(Brush.verticalGradient(listOf(accent, accent.copy(alpha = 0.5f)))),
                    contentAlignment = Alignment.Center
                ) {
                    Text(wag.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""), color = Color(0xFF04140D), fontWeight = FontWeight.Black, style = MaterialTheme.typography.headlineMedium)
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text("#$rank", color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelLarge)
                    Text(wag.name, color = TextHigh, style = MaterialTheme.typography.headlineMedium)
                    Text("with ${wag.partner}", color = TextMid, style = MaterialTheme.typography.bodyLarge)
                    val meta = listOf(wag.nationality, wag.profession).filter { it.isNotBlank() }.joinToString(" · ")
                    if (meta.isNotBlank()) Text(meta, color = TextDim, style = MaterialTheme.typography.labelSmall)
                }
                RatingBadge(wag.overall, accent)
            }
        }
    }
    SubHeader("Beyond the touchline", accent)
    Text(wag.brains, color = TextMid, style = MaterialTheme.typography.bodyLarge)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column {
            StatBar("Looks", "${wag.looksScore}", wag.looksScore / 100f, HotMagenta)
            Spacer(Modifier.height(10.dp))
            StatBar("Brains", "${wag.brainsScore}", wag.brainsScore / 100f, ElectricCyan)
            Spacer(Modifier.height(10.dp))
            StatBar("Overall", "${wag.overall}", wag.overall / 100f, accent)
        }
    }
    if (wag.highlights.isNotEmpty()) {
        SubHeader("Highlights", accent)
        Bullets(wag.highlights, accent)
    }
    Text("A light-hearted fan board — celebrating careers as much as glamour.", color = TextDim, style = MaterialTheme.typography.bodyMedium)
}

@Composable
private fun TeamBlock(name: String, badge: String?, accent: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(120.dp)) {
        Box(Modifier.size(56.dp).clip(CircleShape).background(Brush.verticalGradient(listOf(accent.copy(alpha = 0.5f), accent.copy(alpha = 0.15f)))), contentAlignment = Alignment.Center) {
            if (badge != null) AsyncImage(model = badge, contentDescription = name, modifier = Modifier.size(56.dp).clip(CircleShape))
            else Text(name.take(3).uppercase(), color = TextHigh, style = MaterialTheme.typography.labelLarge)
        }
        Spacer(Modifier.height(8.dp))
        Text(name, color = TextHigh, style = MaterialTheme.typography.titleMedium)
    }
}

@Composable
private fun MatchDetail(match: Match) {
    val accent = if (match.isFinished) NeonLime else ElectricCyan
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
            Text(match.league.uppercase(), color = TextDim, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(14.dp))
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                TeamBlock(match.homeTeam, match.homeBadge, accent)
                Text(match.scoreLine, color = if (match.isFinished) NeonLime else TextMid, fontWeight = FontWeight.Black, style = MaterialTheme.typography.headlineMedium)
                TeamBlock(match.awayTeam, match.awayBadge, accent)
            }
            Spacer(Modifier.height(14.dp))
            Text(if (match.isFinished) "FULL TIME" else "UPCOMING", color = accent, style = MaterialTheme.typography.labelLarge)
        }
    }
    SubHeader("Match info", accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            InfoRow("Competition", match.league)
            match.kickoffEpochMs?.let { InfoRow("Kick-off", fullDateFmt.format(Date(it))) }
            match.venue?.let { InfoRow("Venue", it) }
            match.statusText?.let { InfoRow("Status", it) }
            if (match.isFinished) InfoRow("Final score", "${match.homeTeam} ${match.homeScore} – ${match.awayScore} ${match.awayTeam}")
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = TextDim, style = MaterialTheme.typography.bodyMedium)
        Text(value, color = TextHigh, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(start = 12.dp))
    }
}

@Composable
private fun NewsDetail(item: NewsItem, onOpenLink: (String) -> Unit) {
    val accent = NeonLime
    Box(
        Modifier.clip(RoundedCornerShape(50)).background(accent.copy(alpha = 0.16f)).padding(horizontal = 12.dp, vertical = 5.dp)
    ) { Text(item.category.label.uppercase(), color = accent, style = MaterialTheme.typography.labelSmall) }
    Text(item.title, color = TextHigh, style = MaterialTheme.typography.headlineMedium)
    if (item.summary.isNotBlank()) Text(item.summary, color = TextMid, style = MaterialTheme.typography.bodyLarge)
    Text("${item.source} · ${relative(item.publishedEpochMs)}", color = TextDim, style = MaterialTheme.typography.labelSmall)
    if (item.link.isNotBlank()) {
        GradientCard(modifier = Modifier.fillMaxWidth(), accent = ElectricCyan, onClick = { onOpenLink(item.link) }) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Filled.OpenInNew, contentDescription = null, tint = ElectricCyan)
                Spacer(Modifier.width(10.dp))
                Text("Read the full story", color = TextHigh, style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@Composable
private fun WeatherDetail(w: WeatherNow) {
    val accent = when (w.severity) {
        WeatherSeverity.CLEAR -> NeonLime
        WeatherSeverity.ROUGH -> Gold
        WeatherSeverity.SEVERE -> Color(0xFFFF4D4D)
    }
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column {
            Text(w.venue, color = TextHigh, style = MaterialTheme.typography.headlineMedium)
            Text(w.city, color = TextDim, style = MaterialTheme.typography.labelSmall)
            Spacer(Modifier.height(12.dp))
            Text("${w.temperatureC.toInt()}°C · ${w.condition}", color = accent, style = MaterialTheme.typography.titleLarge)
        }
    }
    SubHeader("Verdict", accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Text(
            when (w.severity) {
                WeatherSeverity.CLEAR -> "Great conditions — expect a clean, free-flowing game."
                WeatherSeverity.ROUGH -> "Tricky underfoot — wind and rain could affect passing and set pieces."
                WeatherSeverity.SEVERE -> "At risk — heavy rain, gale-force wind or storms could disrupt or delay kick-off."
            },
            color = TextMid, style = MaterialTheme.typography.bodyLarge
        )
    }
    SubHeader("Conditions", accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            InfoRow("Temperature", "${w.temperatureC} °C")
            InfoRow("Precipitation", "${w.precipitationMm} mm")
            InfoRow("Wind", "${w.windKph.toInt()} kph")
            InfoRow("Condition", w.condition)
            InfoRow("Playability", w.severity.label)
        }
    }
}

@Composable
private fun StatDetail(stat: BigStat) {
    val accent = Color(stat.accent)
    GradientCard(modifier = Modifier.fillMaxWidth(), accent = accent) {
        Column {
            Text(stat.value, color = accent, fontWeight = FontWeight.Black, style = MaterialTheme.typography.displayLarge)
            Text(stat.headline, color = TextHigh, style = MaterialTheme.typography.titleLarge)
            Spacer(Modifier.height(8.dp))
            Text(stat.detail, color = TextMid, style = MaterialTheme.typography.bodyLarge)
            Spacer(Modifier.height(12.dp))
            StatBar("Record strength", "${(stat.progress * 100).toInt()}%", stat.progress, accent)
        }
    }
    if (stat.facts.isNotEmpty()) {
        SubHeader("Context", accent)
        Bullets(stat.facts, accent)
    }
}

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
