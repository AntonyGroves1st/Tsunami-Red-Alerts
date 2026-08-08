package com.worldfootball.app

import com.worldfootball.app.data.model.NewsCategory
import com.worldfootball.app.data.parse.NewsClassifier
import org.junit.Assert.assertEquals
import org.junit.Test

class NewsClassifierTest {

    @Test
    fun `transfer stories are detected`() {
        assertEquals(NewsCategory.TRANSFER, NewsClassifier.classify("Arsenal agree £60m deal to sign striker"))
        assertEquals(NewsCategory.TRANSFER, NewsClassifier.classify("Star midfielder joins Real Madrid on loan"))
    }

    @Test
    fun `injury stories are detected`() {
        assertEquals(NewsCategory.INJURY, NewsClassifier.classify("Forward ruled out for season with ACL injury"))
        assertEquals(NewsCategory.INJURY, NewsClassifier.classify("Keeper sidelined after hamstring surgery"))
    }

    @Test
    fun `manager stories are detected`() {
        assertEquals(NewsCategory.MANAGER, NewsClassifier.classify("Chelsea sack head coach after poor run"))
        assertEquals(NewsCategory.MANAGER, NewsClassifier.classify("Club appoints new boss ahead of season"))
    }

    @Test
    fun `memoriam beats other verbs`() {
        assertEquals(
            NewsCategory.MEMORIAM,
            NewsClassifier.classify("Former club captain dies aged 82", "The transfer-record signing passed away")
        )
    }

    @Test
    fun `injury beats generic manager word`() {
        // "manager confirms" present, but injury keyword should win for an injury story
        assertEquals(
            NewsCategory.INJURY,
            NewsClassifier.classify("Manager confirms defender is injured", "Out with a hamstring strain")
        )
    }

    @Test
    fun `unrelated stories fall through to general`() {
        assertEquals(NewsCategory.GENERAL, NewsClassifier.classify("Fans celebrate 100 years of the stadium"))
    }
}
