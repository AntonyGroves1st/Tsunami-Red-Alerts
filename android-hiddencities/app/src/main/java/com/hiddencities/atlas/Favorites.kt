package com.hiddencities.atlas

import android.content.Context

/** Persists the set of favourited site ids in SharedPreferences. */
class Favorites(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences("hidden_cities_prefs", Context.MODE_PRIVATE)

    fun ids(): Set<String> =
        prefs.getStringSet(KEY, emptySet())?.toSet() ?: emptySet()

    fun isFavorite(id: String): Boolean = ids().contains(id)

    /** Flip favourite state for [id] and return the new state (true = now a favourite). */
    fun toggle(id: String): Boolean {
        val current = ids().toMutableSet()
        val nowFavorite = if (current.contains(id)) {
            current.remove(id); false
        } else {
            current.add(id); true
        }
        prefs.edit().putStringSet(KEY, current).apply()
        return nowFavorite
    }

    private companion object {
        const val KEY = "favorite_ids"
    }
}
