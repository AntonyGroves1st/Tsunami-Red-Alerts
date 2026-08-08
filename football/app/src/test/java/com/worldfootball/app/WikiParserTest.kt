package com.worldfootball.app

import com.worldfootball.app.data.parse.WikiParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class WikiParserTest {

    @Test
    fun `prefers thumbnail then original`() {
        val json = """
            {"type":"standard","title":"Georgina Rodríguez",
             "thumbnail":{"source":"https://img/thumb.jpg","width":330},
             "originalimage":{"source":"https://img/original.jpg"}}
        """.trimIndent()
        assertEquals("https://img/thumb.jpg", WikiParser.parseImage(json))
    }

    @Test
    fun `falls back to original when no thumbnail`() {
        assertEquals(
            "https://img/original.jpg",
            WikiParser.parseImage("{\"originalimage\":{\"source\":\"https://img/original.jpg\"}}")
        )
    }

    @Test
    fun `no image or malformed returns null`() {
        assertNull(WikiParser.parseImage("{\"type\":\"standard\"}"))
        assertNull(WikiParser.parseImage(""))
        assertNull(WikiParser.parseImage("garbage"))
    }
}
