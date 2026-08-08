package com.worldfootball.app.data.parse

import com.worldfootball.app.data.model.NewsItem
import org.w3c.dom.Element
import java.io.ByteArrayInputStream
import java.text.SimpleDateFormat
import java.util.Locale
import javax.xml.parsers.DocumentBuilderFactory

/**
 * Parses an RSS 2.0 feed into [NewsItem]s using the JDK/Android DOM parser
 * (available on both platforms), so it can be unit tested on the JVM.
 */
object RssParser {

    private val rfc822: List<SimpleDateFormat> = listOf(
        "EEE, dd MMM yyyy HH:mm:ss Z",
        "EEE, dd MMM yyyy HH:mm:ss zzz"
    ).map { SimpleDateFormat(it, Locale.ENGLISH) }

    fun parse(xml: String, source: String): List<NewsItem> {
        if (xml.isBlank()) return emptyList()
        return try {
            val factory = DocumentBuilderFactory.newInstance().apply {
                isNamespaceAware = false
                // Harden against XXE while keeping plain RSS parsing working.
                runCatching { setFeature("http://apache.org/xml/features/disallow-doctype-decl", true) }
                runCatching { setFeature("http://xml.org/sax/features/external-general-entities", false) }
                runCatching { setFeature("http://xml.org/sax/features/external-parameter-entities", false) }
            }
            val doc = factory.newDocumentBuilder()
                .parse(ByteArrayInputStream(xml.toByteArray(Charsets.UTF_8)))
            val items = doc.getElementsByTagName("item")
            val out = ArrayList<NewsItem>(items.length)
            for (i in 0 until items.length) {
                val el = items.item(i) as? Element ?: continue
                val title = el.text("title")
                if (title.isBlank()) continue
                val desc = stripHtml(el.text("description"))
                out.add(
                    NewsItem(
                        title = title,
                        summary = desc,
                        link = el.text("link"),
                        source = source,
                        publishedEpochMs = parseDate(el.text("pubDate")),
                        imageUrl = el.mediaUrl(),
                        category = NewsClassifier.classify(title, desc)
                    )
                )
            }
            out
        } catch (t: Throwable) {
            emptyList()
        }
    }

    private fun Element.text(tag: String): String {
        val nodes = getElementsByTagName(tag)
        if (nodes.length == 0) return ""
        return nodes.item(0)?.textContent?.trim().orEmpty()
    }

    private fun Element.mediaUrl(): String? {
        for (tag in listOf("media:thumbnail", "media:content", "enclosure")) {
            val nodes = getElementsByTagName(tag)
            if (nodes.length > 0) {
                val el = nodes.item(0) as? Element ?: continue
                val url = el.getAttribute("url")
                if (url.isNotBlank()) return url
            }
        }
        return null
    }

    private fun parseDate(raw: String): Long {
        if (raw.isBlank()) return System.currentTimeMillis()
        for (fmt in rfc822) {
            val parsed = runCatching { fmt.parse(raw)?.time }.getOrNull()
            if (parsed != null) return parsed
        }
        return System.currentTimeMillis()
    }

    private fun stripHtml(s: String): String =
        s.replace(Regex("<[^>]*>"), "").replace("&nbsp;", " ").trim()
}
