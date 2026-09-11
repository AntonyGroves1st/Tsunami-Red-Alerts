package com.hiddencities.atlas

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SiteDataTest {

    @Test
    fun catalogIsLarge() {
        assertTrue("Expected a large global atlas", SiteData.all.size >= 100)
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
            assertTrue("blank continent for ${s.id}", s.continent.isNotBlank())
            assertTrue("blank entrance hint for ${s.id}", s.entranceHint.isNotBlank())
            assertTrue("blank description for ${s.id}", s.description.isNotBlank())
            assertTrue("bad latitude for ${s.id}", s.lat in -90.0..90.0)
            assertTrue("bad longitude for ${s.id}", s.lng in -180.0..180.0)
        }
    }

    @Test
    fun coversManyCountriesAndAllContinents() {
        val countries = SiteData.all.map { it.country }.toSet()
        assertTrue("Expected broad country coverage", countries.size >= 25)

        val continents = SiteData.continents()
        listOf("Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Mythic")
            .forEach { assertTrue("missing continent $it", continents.contains(it)) }
    }

    @Test
    fun byIdResolvesKnownSites() {
        assertEquals("Derinkuyu Underground City", SiteData.byId("derinkuyu")?.name)
        assertEquals(null, SiteData.byId("does-not-exist"))
    }

    @Test
    fun freeTextSearchMatchesNamesAndPlaces() {
        val turkey = SiteData.filter(query = "turkey")
        assertTrue(turkey.size >= 5)
        assertTrue(turkey.any { it.id == "derinkuyu" })

        val derinkuyu = SiteData.filter(query = "derinkuyu")
        assertTrue(derinkuyu.any { it.id == "derinkuyu" })
        assertEquals("derinkuyu", derinkuyu.first().id)
    }

    @Test
    fun multiTokenSearchRequiresAllTokens() {
        val results = SiteData.filter(query = "salt poland")
        assertTrue(results.map { it.id }.contains("wieliczka"))
        assertTrue(results.all { it.country == "Poland" })
    }

    @Test
    fun typeFilterRestrictsResults() {
        val cities = SiteData.filter(type = SiteType.UNDERGROUND_CITY)
        assertTrue(cities.isNotEmpty())
        assertTrue(cities.all { it.type == SiteType.UNDERGROUND_CITY })

        val myths = SiteData.filter(type = SiteType.MYTH_GATEWAY)
        assertTrue("Expected legendary gateways", myths.size >= 5)
    }

    @Test
    fun continentFilterRestrictsResults() {
        val asia = SiteData.filter(continent = "Asia")
        assertTrue(asia.isNotEmpty())
        assertTrue(asia.all { it.continent == "Asia" })

        val combined = SiteData.filter(type = SiteType.UNDERGROUND_CITY, continent = "Asia")
        assertTrue(combined.all { it.type == SiteType.UNDERGROUND_CITY && it.continent == "Asia" })
        assertTrue(combined.any { it.id == "derinkuyu" })
    }

    @Test
    fun mythicEntriesAreClearlyLabelled() {
        val mythic = SiteData.all.filter { it.continent == "Mythic" }
        assertTrue(mythic.isNotEmpty())
        assertTrue(mythic.all { it.type == SiteType.MYTH_GATEWAY })
        assertTrue(mythic.all { it.access == Access.LEGENDARY })
        assertTrue(mythic.any { it.id == "agartha" })
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
