package com.worldfootball.app.data

import com.worldfootball.app.data.model.Match
import com.worldfootball.app.data.model.NewsItem
import com.worldfootball.app.data.model.Player
import com.worldfootball.app.data.model.Wag
import com.worldfootball.app.data.model.WeatherNow
import com.worldfootball.app.data.parse.RssParser
import com.worldfootball.app.data.parse.SportsDbParser
import com.worldfootball.app.data.parse.WeatherParser
import com.worldfootball.app.data.parse.WikiParser
import com.worldfootball.app.data.remote.RemoteSources
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

class FootballRepository(
    private val remote: RemoteSources = RemoteSources()
) {
    /** Fetches all free news feeds in parallel, merges, de-duplicates and sorts. */
    suspend fun loadNews(): List<NewsItem> = coroutineScope {
        RemoteSources.NEWS_FEEDS
            .map { (source, url) -> async { RssParser.parse(remote.feed(url), source) } }
            .flatMap { it.await() }
            .distinctBy { it.title.lowercase().trim() }
            .sortedByDescending { it.publishedEpochMs }
    }

    /**
     * Enriches curated players with a real portrait: TheSportsDB cutout first
     * (transparent headshot), then Wikipedia's Commons lead image as a fallback.
     */
    suspend fun enrichPlayers(players: List<Player>): List<Player> = coroutineScope {
        players
            .map { p ->
                async {
                    val cutout = SportsDbParser.parsePlayerImage(remote.searchPlayer(p.name))
                    val img = cutout
                        ?: WikiParser.parseImage(remote.wikipediaImage(p.wiki.ifBlank { p.name }))
                    if (img != null) p.copy(imageUrl = img) else p
                }
            }
            .map { it.await() }
    }

    /** Enriches WAGs with a Wikipedia (Commons) portrait where one exists. */
    suspend fun enrichWags(wags: List<Wag>): List<Wag> = coroutineScope {
        wags
            .map { w ->
                async {
                    val img = WikiParser.parseImage(remote.wikipediaImage(w.wiki.ifBlank { w.name }))
                    if (img != null) w.copy(imageUrl = img) else w
                }
            }
            .map { it.await() }
    }

    suspend fun loadResults(): List<Match> = coroutineScope {
        StaticData.leagues
            .map { (id, _) -> async { SportsDbParser.parseEvents(remote.pastEvents(id)) } }
            .flatMap { it.await() }
            .filter { it.isFinished }
            .sortedByDescending { it.kickoffEpochMs ?: 0L }
    }

    suspend fun loadFixtures(): List<Match> = coroutineScope {
        StaticData.leagues
            .map { (id, _) -> async { SportsDbParser.parseEvents(remote.nextEvents(id)) } }
            .flatMap { it.await() }
            .sortedBy { it.kickoffEpochMs ?: Long.MAX_VALUE }
    }

    suspend fun loadWeather(): List<WeatherNow> = coroutineScope {
        StaticData.venues
            .map { venue ->
                async {
                    WeatherParser.parse(remote.weather(venue.latitude, venue.longitude), venue)
                }
            }
            .mapNotNull { it.await() }
    }
}
