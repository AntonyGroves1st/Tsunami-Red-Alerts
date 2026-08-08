package com.hiddencities.atlas

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SiteDataTest {

    @Test
    fun catalogIsNonEmpty() {
        assertTrue("Expected a populated atlas", SiteData.all.size >= 20)
    }

    @Test
    fun allIdsAreUnique() {
        val ids = SiteData.all.map { it.id }
        assertEquals("Ids must be unique", ids.size, ids.toSet().size)
    }

    @Test
    fun everySiteHasRequiredContent() {
        SiteData.all.forEach { s ->
            assertTrue("blank name", s.name.isNotBlank())
            assertTrue("blank country", s.country.isNotBlank())
            assertTrue("blank entrance hint for ${s.id}", s.entranceHint.isNotBlank())
            assertTrue("blank description for ${s.id}", s.description.isNotBlank())
            assertTrue("bad latitude for ${s.id}", s.lat in -90.0..90.0)
            assertTrue("bad longitude for ${s.id}", s.lng in -180.0..180.0)
        }
    }

    @Test
    fun byIdResolvesKnownSites() {
        assertEquals("Derinkuyu Underground City", SiteData.byId("derinkuyu")?.name)
        assertEquals(null, SiteData.byId("does-not-exist"))
    }

    @Test
    fun freeTextSearchMatchesNameAndCountry() {
        val turkey = SiteData.filter(query = "turkey")
        assertTrue(turkey.isNotEmpty())
        assertTrue(turkey.all { it.country == "Turkey" })

        // "derinkuyu" also appears in Kaymaklı's description (they are linked),
        // so search is a substring match, not an exact-name match.
        val derinkuyu = SiteData.filter(query = "derinkuyu")
        assertTrue(derinkuyu.any { it.id == "derinkuyu" })
        assertEquals("derinkuyu", derinkuyu.first().id)
    }

    @Test
    fun multiTokenSearchRequiresAllTokens() {
        val results = SiteData.filter(query = "salt poland")
        assertEquals(1, results.size)
        assertEquals("wieliczka", results.first().id)
    }

    @Test
    fun typeFilterRestrictsResults() {
        val cities = SiteData.filter(type = SiteType.UNDERGROUND_CITY)
        assertTrue(cities.isNotEmpty())
        assertTrue(cities.all { it.type == SiteType.UNDERGROUND_CITY })
    }

    @Test
    fun favoritesFilterUsesProvidedIds() {
        val favs = setOf("derinkuyu", "wieliczka")
        val results = SiteData.filter(favoritesOnly = true, favoriteIds = favs)
        assertEquals(2, results.size)
        assertTrue(results.map { it.id }.containsAll(favs))

        val none = SiteData.filter(favoritesOnly = true, favoriteIds = emptySet())
        assertTrue(none.isEmpty())
    }

    @Test
    fun resultsAreSortedByName() {
        val names = SiteData.filter().map { it.name }
        assertEquals(names.sorted(), names)
    }

    @Test
    fun geoUriIsWellFormed() {
        val site = SiteData.byId("derinkuyu")!!
        val uri = site.geoUri()
        assertTrue(uri.startsWith("geo:${site.lat},${site.lng}"))
        assertFalse("label should be url-encoded", uri.contains(" "))
    }

    @Test
    fun coordinateStringHasFourDecimals() {
        val site = SiteData.byId("kaymakli")!!
        assertTrue(Regex("^-?\\d+\\.\\d{4}, -?\\d+\\.\\d{4}$").matches(site.coordinateString()))
    }
}
