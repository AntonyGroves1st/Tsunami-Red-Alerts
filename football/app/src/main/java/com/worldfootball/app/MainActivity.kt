package com.worldfootball.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.ui.components.BrandHeader
import com.worldfootball.app.ui.components.PitchBackground
import com.worldfootball.app.ui.screens.DetailScreen
import com.worldfootball.app.ui.screens.DetailTarget
import com.worldfootball.app.ui.screens.FixturesScreen
import com.worldfootball.app.ui.screens.HomeScreen
import com.worldfootball.app.ui.screens.LegendsScreen
import com.worldfootball.app.ui.screens.NewsScreen
import com.worldfootball.app.ui.screens.ResultsScreen
import com.worldfootball.app.ui.screens.StatsScreen
import com.worldfootball.app.ui.screens.WagsScreen
import com.worldfootball.app.ui.screens.WeatherScreen
import com.worldfootball.app.ui.screens.YoungGunsScreen
import com.worldfootball.app.ui.theme.NeonLime
import com.worldfootball.app.ui.theme.PitchNight
import com.worldfootball.app.ui.theme.TextDim
import com.worldfootball.app.ui.theme.WorldFootballTheme
import kotlinx.coroutines.launch

private enum class WfTab(val title: String) {
    HOME("Home"),
    RESULTS("Results"),
    FIXTURES("Fixtures"),
    TRANSFERS("Transfers"),
    INJURIES("Injuries"),
    MANAGERS("Managers"),
    WEATHER("Weather"),
    LEGENDS("Legends"),
    YOUNG_GUNS("Young Guns"),
    WAGS("WAGs"),
    STATS("Big Stats"),
    MEMORIAM("In Memoriam")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            WorldFootballTheme {
                WorldFootballApp()
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun WorldFootballApp() {
    val vm: FootballViewModel = viewModel()
    val state by vm.state.collectAsState()
    val tabs = WfTab.values()
    val pagerState = rememberPagerState(pageCount = { tabs.size })
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var detail by remember { mutableStateOf<DetailTarget?>(null) }
    val open: (DetailTarget) -> Unit = { detail = it }

    Box(Modifier.fillMaxSize().background(PitchNight)) {
        PitchBackground()

        Column(
            Modifier
                .fillMaxSize()
                .windowInsetsPadding(WindowInsets.statusBars)
        ) {
            Spacer(Modifier.height(12.dp))
            BrandHeader(subtitle = "TRANSFERS · INJURIES · FIXTURES · LEGENDS")
            Spacer(Modifier.height(14.dp))

            ScrollableTabRow(
                selectedTabIndex = pagerState.currentPage,
                edgePadding = 16.dp,
                containerColor = Color.Transparent,
                contentColor = NeonLime,
                divider = {}
            ) {
                tabs.forEachIndexed { index, tab ->
                    val selected = pagerState.currentPage == index
                    Tab(
                        selected = selected,
                        onClick = { scope.launch { pagerState.animateScrollToPage(index) } },
                        text = {
                            Text(
                                tab.title,
                                style = MaterialTheme.typography.labelLarge,
                                color = if (selected) NeonLime else TextDim
                            )
                        }
                    )
                }
            }

            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxWidth().weight(1f)
            ) { page ->
                when (tabs[page]) {
                    WfTab.HOME -> HomeScreen(state, open)
                    WfTab.RESULTS -> ResultsScreen(state, open)
                    WfTab.FIXTURES -> FixturesScreen(state, open)
                    WfTab.TRANSFERS -> NewsScreen(state, NewsCategory.TRANSFER, "No transfer stories in the feed yet.", open)
                    WfTab.INJURIES -> NewsScreen(state, NewsCategory.INJURY, "No injury news right now — good news!", open)
                    WfTab.MANAGERS -> NewsScreen(state, NewsCategory.MANAGER, "No manager moves in the feed yet.", open)
                    WfTab.WEATHER -> WeatherScreen(state, open)
                    WfTab.LEGENDS -> LegendsScreen(state, open)
                    WfTab.YOUNG_GUNS -> YoungGunsScreen(state, open)
                    WfTab.WAGS -> WagsScreen(state, open)
                    WfTab.STATS -> StatsScreen(open)
                    WfTab.MEMORIAM -> NewsScreen(state, NewsCategory.MEMORIAM, "No memoriam stories in the feed.", open)
                }
            }
        }

        if (detail == null) {
            FloatingActionButton(
                onClick = { vm.refresh() },
                containerColor = NeonLime,
                contentColor = PitchNight,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(20.dp)
            ) {
                Icon(Icons.Filled.Refresh, contentDescription = "Refresh")
            }
        }

        AnimatedVisibility(
            visible = detail != null,
            enter = fadeIn() + slideInVertically(initialOffsetY = { it / 5 }),
            exit = fadeOut() + slideOutVertically(targetOffsetY = { it / 5 })
        ) {
            val current = detail
            if (current != null) {
                DetailScreen(
                    target = current,
                    onClose = { detail = null },
                    onOpenLink = { url ->
                        runCatching {
                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        }
                    }
                )
            }
        }
    }

    BackHandler(enabled = detail != null) { detail = null }
}
