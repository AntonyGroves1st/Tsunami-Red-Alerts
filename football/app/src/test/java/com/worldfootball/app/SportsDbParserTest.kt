package com.worldfootball.app

import com.worldfootball.app.data.parse.SportsDbParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SportsDbParserTest {

    // Shape mirrors the real eventspastleague / eventsnextleague responses.
    private val finished = """
        {"events":[
          {"idEvent":"111","strLeague":"English Premier League",
           "strLeagueBadge":"https://img/league.png",
           "strHomeTeam":"West Ham United","strAwayTeam":"Leeds United",
           "intHomeScore":"2","intAwayScore":"1",
           "strTimestamp":"2026-05-24T15:00:00","strVenue":"London Stadium","strStatus":"Match Finished"}
        ]}
    """.trimIndent()

    private val upcoming = """
        {"events":[
          {"idEvent":"222","strLeague":"English Premier League",
           "strHomeTeam":"Arsenal","strAwayTeam":"Coventry City",
           "intHomeScore":null,"intAwayScore":null,
           "strTimestamp":"2026-08-21T19:00:00"}
        ]}
    """.trimIndent()

    @Test
    fun `parses a finished result`() {
        val m = SportsDbParser.parseEvents(finished).single()
        assertEquals("West Ham United", m.homeTeam)
        assertEquals("Leeds United", m.awayTeam)
        assertEquals(2, m.homeScore)
        assertEquals(1, m.awayScore)
        assertTrue(m.isFinished)
        assertEquals("2 - 1", m.scoreLine)
        assertEquals("London Stadium", m.venue)
        assertTrue((m.kickoffEpochMs ?: 0) > 0L)
    }

    @Test
    fun `parses an upcoming fixture with null scores`() {
        val m = SportsDbParser.parseEvents(upcoming).single()
        assertEquals("Arsenal", m.homeTeam)
        assertNull(m.homeScore)
        assertFalse(m.isFinished)
        assertEquals("vs", m.scoreLine)
    }

    @Test
    fun `handles empty and malformed payloads`() {
        assertTrue(SportsDbParser.parseEvents("{\"events\":null}").isEmpty())
        assertTrue(SportsDbParser.parseEvents("{}").isEmpty())
        assertTrue(SportsDbParser.parseEvents("").isEmpty())
        assertTrue(SportsDbParser.parseEvents("garbage").isEmpty())
    }
}
