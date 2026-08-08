package com.worldfootball.app.data

import com.worldfootball.app.data.model.Match
import com.worldfootball.app.data.model.NewsItem
import com.worldfootball.app.data.model.WeatherNow
import com.worldfootball.app.data.parse.RssParser
import com.worldfootball.app.data.parse.SportsDbParser
import com.worldfootball.app.data.parse.WeatherParser
import com.worldfootball.app.data.remote.RemoteSources
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

class FootballRepository(
    private val remote: RemoteSources = RemoteSources()
) {
    suspend fun loadNews(): List<NewsItem> {
        val xml = remote.bbcFootball()
        return RssParser.parse(xml, "BBC Sport")
            .sortedByDescending { it.publishedEpochMs }
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
