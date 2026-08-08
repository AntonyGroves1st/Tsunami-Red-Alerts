package com.hiddencities.atlas

/** Broad category of a subterranean site. */
enum class SiteType(val label: String) {
    UNDERGROUND_CITY("Underground city"),
    CAVE_DWELLING("Cave dwelling"),
    ROCK_CITY("Rock-cut city"),
    TUNNEL_NETWORK("Tunnel network"),
    MINE("Mine city"),
    CAVE_SYSTEM("Cave system"),
    BUNKER("Hidden bunker");

    companion object {
        fun fromLabel(label: String): SiteType? = values().firstOrNull { it.label == label }
    }
}

/** How reachable the hidden entrance is today. */
enum class Access(val label: String) {
    PUBLIC_TOUR("Open to visitors"),
    GUIDED_ONLY("Guided access only"),
    RESTRICTED("Restricted / permit"),
    ABANDONED("Abandoned / unofficial")
}

/**
 * A hidden cave or concealed entrance leading to an underground / rock-cut settlement.
 *
 * @param depthNote human-readable scale of the site (levels, depth, length)
 * @param entranceHint where the concealed entrance is and how it was disguised
 */
data class HiddenSite(
    val id: String,
    val name: String,
    val aka: String?,
    val country: String,
    val region: String,
    val type: SiteType,
    val lat: Double,
    val lng: Double,
    val era: String,
    val depthNote: String,
    val access: Access,
    val shortDesc: String,
    val entranceHint: String,
    val description: String
) {
    /** Text blob used for free-text search. */
    val searchIndex: String by lazy {
        listOf(name, aka ?: "", country, region, type.label, era, shortDesc, description)
            .joinToString(" ")
            .lowercase()
    }

    fun coordinateString(): String =
        "%.4f, %.4f".format(java.util.Locale.US, lat, lng)

    /** A `geo:` URI that map apps understand, with a labelled pin. */
    fun geoUri(): String {
        val label = java.net.URLEncoder.encode(name, "UTF-8")
        return "geo:$lat,$lng?q=$lat,$lng($label)"
    }
}
