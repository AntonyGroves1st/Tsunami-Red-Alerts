package com.marketcrash.predictor

import java.util.Locale
import kotlin.math.abs
import kotlin.math.roundToInt

/**
 * Heuristic sentinel layer. Derives "elite early-bird" indicators — billionaire
 * movement, New Zealand inbound surge (the bunker trigger) and world-leader
 * posture — **deterministically from the live Crash Index**, salted per entity
 * and per day so the board feels alive but is fully reproducible.
 *
 * These indicators are an illustrative metaphor for tail-risk behaviour.
 * The app does not track real people, jets or ticket sales.
 */
object SentinelEngine {

    /** Stable pseudo-random 0..99 for an entity on a given day. */
    fun entityRoll(entityKey: String, daySeed: Long): Int {
        var h = 1125899906842597L
        for (c in entityKey) h = 31 * h + c.code
        h = h xor (daySeed * 2654435761L)
        return (abs(h) % 100L).toInt()
    }

    /**
     * Agitation 0..3 for an entity. Monotonically non-decreasing in [score]:
     * the hotter the market stress, the more of the watchlist stirs.
     */
    fun agitation(entityKey: String, score: Int, daySeed: Long): Int {
        val roll = entityRoll(entityKey, daySeed)
        val s = score.coerceIn(0, 100)
        return when {
            roll < (s * 15) / 100 -> 3
            roll < (s * 40) / 100 -> 2
            roll < (s * 80) / 100 -> 1
            else -> 0
        }
    }

    fun billionaireBoard(score: Int, daySeed: Long): List<SentinelStatus> =
        SentinelData.billionaires.map { b ->
            val a = agitation("b:" + b.name, score, daySeed)
            SentinelStatus(b.name, "${b.source} · ${b.country} — ${billionaireLabel(a)}", a)
        }

    fun leaderBoard(score: Int, daySeed: Long): List<SentinelStatus> =
        SentinelData.leaders.map { l ->
            val a = agitation("l:" + l.role + l.country, score, daySeed)
            SentinelStatus("${l.role} — ${l.country}", leaderLabel(a), a)
        }

    fun routeBoard(score: Int, daySeed: Long): List<SentinelStatus> =
        SentinelData.nzRoutes.map { r ->
            val a = agitation("r:" + r.fromCode + r.toCode, score, daySeed)
            SentinelStatus("${r.fromCode} → ${r.toCode}", "${r.from} — ${routeLabel(a)}", a)
        }

    /**
     * The "bunker trigger" gauge: a 0–100 New Zealand inbound pressure index.
     * Quiet markets idle in the teens; a full crash pins it near 100.
     */
    fun nzInboundIndex(score: Int, daySeed: Long): Int {
        val jitter = entityRoll("nz-index", daySeed) % 7
        return (8 + jitter + score * 0.82).roundToInt().coerceIn(0, 100)
    }

    fun countAgitated(board: List<SentinelStatus>): Int = board.count { it.agitation >= 2 }

    fun summary(score: Int, daySeed: Long): String {
        val b = countAgitated(billionaireBoard(score, daySeed))
        val l = countAgitated(leaderBoard(score, daySeed))
        val nz = nzInboundIndex(score, daySeed)
        return String.format(
            Locale.US,
            "%d of 50 fortunes in motion · %d leader offices repositioning · NZ inbound %d/100",
            b, l, nz
        )
    }

    private fun billionaireLabel(a: Int) = when (a) {
        3 -> "JET FILED SOUTH"
        2 -> "assets rotating"
        1 -> "quiet hedging"
        else -> "no unusual activity"
    }

    private fun leaderLabel(a: Int) = when (a) {
        3 -> "Emergency posture"
        2 -> "Unscheduled meetings"
        1 -> "Elevated chatter"
        else -> "Routine schedule"
    }

    private fun routeLabel(a: Int) = when (a) {
        3 -> "SURGING"
        2 -> "filling fast"
        1 -> "above seasonal"
        else -> "normal load"
    }
}
