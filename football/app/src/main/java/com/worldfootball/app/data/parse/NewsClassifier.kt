package com.worldfootball.app.data.parse

import com.worldfootball.app.data.model.NewsCategory

/**
 * Keyword-driven classifier that buckets a raw news headline/summary into a
 * [NewsCategory]. Pure function so it is fully covered by JVM unit tests.
 */
object NewsClassifier {

    private val memoriam = listOf(
        "dies", "dead", "death", "passes away", "passed away", "obituary",
        "tragically", "mourns", "rest in peace", "rip "
    )
    private val transfer = listOf(
        "transfer", "signs", "signing", "signed", "joins", "move to", "moves to",
        "loan", "fee", "bid", "deal", "agree", "agrees", "medical", "unveiled",
        "release clause", "swap", "contract"
    )
    private val injury = listOf(
        "injury", "injured", "acl", "hamstring", "sidelined", "ruled out",
        "surgery", "operation", "layoff", "fitness", "strain", "knock", "recovery"
    )
    private val manager = listOf(
        "manager", "head coach", "sacked", "sack", "appointed", "appoint",
        "new boss", "dugout", "interim", "resigns", "resigned", "takes charge",
        "hire", "hired"
    )

    fun classify(title: String, summary: String = ""): NewsCategory {
        val text = (title + " " + summary).lowercase()
        // Order matters: memoriam and injuries beat generic transfer/manager verbs.
        return when {
            memoriam.any { text.contains(it) } -> NewsCategory.MEMORIAM
            injury.any { text.contains(it) } -> NewsCategory.INJURY
            manager.any { text.contains(it) } -> NewsCategory.MANAGER
            transfer.any { text.contains(it) } -> NewsCategory.TRANSFER
            else -> NewsCategory.GENERAL
        }
    }
}
