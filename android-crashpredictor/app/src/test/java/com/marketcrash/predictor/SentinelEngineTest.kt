package com.marketcrash.predictor

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SentinelEngineTest {

    private val seed = 20260911L

    @Test
    fun watchlistsAreFullyPopulated() {
        assertEquals(50, SentinelData.billionaires.size)
        assertTrue(SentinelData.leaders.size >= 20)
        assertTrue(SentinelData.nzRoutes.size >= 10)
        // The user asked for the richest men AND women.
        val names = SentinelData.billionaires.map { it.name }
        assertTrue(names.contains("Alice Walton"))
        assertTrue(names.contains("Francoise Bettencourt Meyers"))
    }

    @Test
    fun agitationIsDeterministic() {
        val a1 = SentinelEngine.agitation("b:Elon Musk", 60, seed)
        val a2 = SentinelEngine.agitation("b:Elon Musk", 60, seed)
        assertEquals(a1, a2)
    }

    @Test
    fun agitationIsMonotonicInScore() {
        for (entity in listOf("b:Elon Musk", "l:PresidentUnited States", "r:LAXAKL")) {
            var prev = 0
            for (score in 0..100 step 5) {
                val a = SentinelEngine.agitation(entity, score, seed)
                assertTrue("agitation regressed for $entity at $score", a >= prev)
                prev = a
            }
        }
    }

    @Test
    fun calmMarketsKeepTheBoardQuiet() {
        val board = SentinelEngine.billionaireBoard(0, seed)
        assertTrue(board.all { it.agitation == 0 })
        assertEquals(0, SentinelEngine.countAgitated(board))
    }

    @Test
    fun crashMarketsStirTheBoard() {
        val calm = SentinelEngine.countAgitated(SentinelEngine.billionaireBoard(10, seed))
        val crash = SentinelEngine.countAgitated(SentinelEngine.billionaireBoard(95, seed))
        assertTrue("crash board should out-agitate calm board", crash > calm)
        assertTrue("a 95 index should move several fortunes", crash >= 5)
    }

    @Test
    fun nzIndexScalesWithScoreAndStaysInBounds() {
        val quiet = SentinelEngine.nzInboundIndex(0, seed)
        val panic = SentinelEngine.nzInboundIndex(100, seed)
        assertTrue(quiet in 0..30)
        assertTrue(panic in 70..100)
        assertTrue(panic > quiet)
    }

    @Test
    fun summaryMentionsAllThreeBoards() {
        val s = SentinelEngine.summary(80, seed)
        assertTrue(s.contains("of 50 fortunes"))
        assertTrue(s.contains("leader offices"))
        assertTrue(s.contains("NZ inbound"))
    }
}
