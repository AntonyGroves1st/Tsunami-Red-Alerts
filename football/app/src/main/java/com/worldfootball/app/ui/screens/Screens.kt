package com.worldfootball.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.worldfootball.app.FootballUiState
import com.worldfootball.app.data.StaticData
import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.ui.components.BigStatCard
import com.worldfootball.app.ui.components.EmptyHint
import com.worldfootball.app.ui.components.MatchCard
import com.worldfootball.app.ui.components.NewsCard
import com.worldfootball.app.ui.components.PlayerCard
import com.worldfootball.app.ui.components.SectionTitle
import com.worldfootball.app.ui.components.ShimmerCard
import com.worldfootball.app.ui.components.WagCard
import com.worldfootball.app.ui.components.WeatherCard
import com.worldfootball.app.ui.theme.TextDim

private val listPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 120.dp)

@Composable
private fun LoadingList(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(5) { ShimmerCard() }
    }
}

@Composable
fun HomeScreen(state: FootballUiState, modifier: Modifier = Modifier) {
    if (state.loading) {
        LoadingList(modifier); return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        state.lastError?.let {
            item { Text(it, color = TextDim, style = MaterialTheme.typography.bodyMedium) }
        }
        if (state.breaking.isNotEmpty()) {
            item { SectionTitle("Breaking") }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    itemsIndexed(state.breaking) { i, news ->
                        NewsCard(news, breaking = i == 0, modifier = Modifier.width(300.dp))
                    }
                }
            }
        }
        if (state.results.isNotEmpty()) {
            item { SectionTitle("Latest Results") }
            items(state.results.take(6)) { MatchCard(it) }
        }
        if (state.fixtures.isNotEmpty()) {
            item { SectionTitle("Upcoming Fixtures") }
            items(state.fixtures.take(8)) { MatchCard(it) }
        }
        if (state.breaking.isEmpty() && state.results.isEmpty() && state.fixtures.isEmpty()) {
            item { EmptyHint("No live data yet — tap refresh to pull the latest feeds.") }
        }
    }
}

@Composable
fun NewsScreen(state: FootballUiState, category: NewsCategory, emptyText: String, modifier: Modifier = Modifier) {
    if (state.loading) {
        LoadingList(modifier); return
    }
    val items = state.newsFor(category)
    if (items.isEmpty()) {
        EmptyHint(emptyText, modifier); return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(items) { NewsCard(it) }
    }
}

@Composable
fun WeatherScreen(state: FootballUiState, modifier: Modifier = Modifier) {
    if (state.loading) {
        LoadingList(modifier); return
    }
    if (state.weather.isEmpty()) {
        EmptyHint("Weather feed unavailable right now.", modifier); return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                "Live match-day conditions at marquee grounds",
                color = TextDim,
                style = MaterialTheme.typography.bodyMedium
            )
            Spacer(Modifier.height(4.dp))
        }
        items(state.weather) { WeatherCard(it) }
    }
}

@Composable
fun ResultsScreen(state: FootballUiState, modifier: Modifier = Modifier) {
    if (state.loading) {
        LoadingList(modifier); return
    }
    if (state.results.isEmpty()) {
        EmptyHint("No recent results loaded.", modifier); return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(state.results) { MatchCard(it) }
    }
}

@Composable
fun FixturesScreen(state: FootballUiState, modifier: Modifier = Modifier) {
    if (state.loading) {
        LoadingList(modifier); return
    }
    if (state.fixtures.isEmpty()) {
        EmptyHint("No upcoming fixtures loaded.", modifier); return
    }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(state.fixtures) { MatchCard(it) }
    }
}

@Composable
fun LegendsScreen(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("The greatest to ever lace up — an all-time XI of icons.", color = TextDim, style = MaterialTheme.typography.bodyMedium)
        }
        itemsIndexed(StaticData.legends) { i, p -> PlayerCard(p, rank = i + 1) }
    }
}

@Composable
fun YoungGunsScreen(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Youth players tipped to define the next decade.", color = TextDim, style = MaterialTheme.typography.bodyMedium)
        }
        itemsIndexed(StaticData.youngGuns) { i, p -> PlayerCard(p, rank = i + 1) }
    }
}

@Composable
fun WagsScreen(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Ranked for looks and brains — a light-hearted fan board.", color = TextDim, style = MaterialTheme.typography.bodyMedium)
        }
        itemsIndexed(StaticData.wags) { i, w -> WagCard(w, rank = i + 1) }
    }
}

@Composable
fun StatsScreen(modifier: Modifier = Modifier) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = listPadding,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Numbers that tell football's biggest stories.", color = TextDim, style = MaterialTheme.typography.bodyMedium)
        }
        items(StaticData.bigStats) { BigStatCard(it) }
    }
}
