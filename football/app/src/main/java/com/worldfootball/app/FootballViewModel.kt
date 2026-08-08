package com.worldfootball.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.worldfootball.app.data.FootballRepository
import com.worldfootball.app.data.StaticData
import com.worldfootball.app.data.model.Match
import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.data.model.NewsItem
import com.worldfootball.app.data.model.Player
import com.worldfootball.app.data.model.WeatherNow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FootballUiState(
    val loading: Boolean = true,
    val news: List<NewsItem> = emptyList(),
    val results: List<Match> = emptyList(),
    val fixtures: List<Match> = emptyList(),
    val weather: List<WeatherNow> = emptyList(),
    val legends: List<Player> = StaticData.legends,
    val youngGuns: List<Player> = StaticData.youngGuns,
    val lastError: String? = null
) {
    fun newsFor(category: NewsCategory): List<NewsItem> =
        if (category == NewsCategory.GENERAL) news else news.filter { it.category == category }

    val breaking: List<NewsItem> get() = news.take(6)
}

class FootballViewModel(
    private val repository: FootballRepository = FootballRepository()
) : ViewModel() {

    private val _state = MutableStateFlow(FootballUiState())
    val state: StateFlow<FootballUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        _state.value = _state.value.copy(loading = true, lastError = null)
        viewModelScope.launch {
            val news = runCatching { repository.loadNews() }.getOrDefault(emptyList())
            val results = runCatching { repository.loadResults() }.getOrDefault(emptyList())
            val fixtures = runCatching { repository.loadFixtures() }.getOrDefault(emptyList())
            val weather = runCatching { repository.loadWeather() }.getOrDefault(emptyList())
            val legends = runCatching { repository.enrichPlayers(StaticData.legends) }
                .getOrDefault(StaticData.legends)
            val youngGuns = runCatching { repository.enrichPlayers(StaticData.youngGuns) }
                .getOrDefault(StaticData.youngGuns)
            val nothing = news.isEmpty() && results.isEmpty() && fixtures.isEmpty() && weather.isEmpty()
            _state.value = FootballUiState(
                loading = false,
                news = news,
                results = results,
                fixtures = fixtures,
                weather = weather,
                legends = legends,
                youngGuns = youngGuns,
                lastError = if (nothing) "Couldn't reach live feeds. Pull to retry." else null
            )
        }
    }
}
