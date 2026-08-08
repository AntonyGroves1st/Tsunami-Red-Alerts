package com.worldfootball.app

import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.data.parse.RssParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RssParserTest {

    private val sample = """
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
          <channel>
            <title>BBC Sport - Football</title>
            <item>
              <title>Striker signs new five-year deal</title>
              <description><![CDATA[The forward has agreed a <b>bumper</b> contract.]]></description>
              <link>https://example.com/1</link>
              <pubDate>Fri, 08 Aug 2026 09:00:00 GMT</pubDate>
              <media:thumbnail url="https://img.example.com/a.jpg" width="240" height="135"/>
            </item>
            <item>
              <title>Midfielder ruled out with hamstring injury</title>
              <description>Out for six weeks.</description>
              <link>https://example.com/2</link>
              <pubDate>Fri, 08 Aug 2026 08:30:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
    """.trimIndent()

    @Test
    fun `parses items with fields and categories`() {
        val items = RssParser.parse(sample, "BBC Sport")
        assertEquals(2, items.size)

        val first = items[0]
        assertEquals("Striker signs new five-year deal", first.title)
        assertEquals("BBC Sport", first.source)
        assertEquals("https://example.com/1", first.link)
        assertEquals("https://img.example.com/a.jpg", first.imageUrl)
        assertTrue("html should be stripped", !first.summary.contains("<b>"))
        assertEquals(NewsCategory.TRANSFER, first.category)

        assertEquals(NewsCategory.INJURY, items[1].category)
    }

    @Test
    fun `blank or malformed feed yields empty`() {
        assertTrue(RssParser.parse("", "x").isEmpty())
        assertTrue(RssParser.parse("not xml at all", "x").isEmpty())
    }

    @Test
    fun `pubDate is parsed to epoch`() {
        val items = RssParser.parse(sample, "BBC Sport")
        assertTrue(items[0].publishedEpochMs > 0L)
    }
}
