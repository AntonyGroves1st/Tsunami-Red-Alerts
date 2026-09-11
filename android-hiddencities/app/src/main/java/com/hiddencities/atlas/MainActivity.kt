package com.hiddencities.atlas

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.SearchView
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import com.hiddencities.atlas.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var favorites: Favorites
    private lateinit var adapter: SiteAdapter

    private var query: String = ""
    private var selectedType: SiteType? = null
    private var selectedContinent: String? = null
    private var favoritesOnly: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setSupportActionBar(binding.toolbar)

        favorites = Favorites(this)

        adapter = SiteAdapter(
            isFavorite = { favorites.isFavorite(it) },
            onClick = { site ->
                startActivity(
                    Intent(this, DetailActivity::class.java)
                        .putExtra(DetailActivity.EXTRA_SITE_ID, site.id)
                )
            }
        )
        binding.siteList.layoutManager = LinearLayoutManager(this)
        binding.siteList.adapter = adapter

        buildContinentChips()
        buildTypeChips()
        refresh()
    }

    private fun buildContinentChips() {
        val group = binding.continentChips
        group.removeAllViews()

        val everywhere = makeChip(getString(R.string.all_continents), checked = true) { chip ->
            if (chip.isChecked) {
                selectedContinent = null
                uncheckExcept(group, chip)
                refresh()
            } else {
                chip.isChecked = true
            }
        }
        group.addView(everywhere)

        SiteData.continents().forEach { continent ->
            group.addView(makeChip(continent, checked = false) { chip ->
                if (chip.isChecked) {
                    selectedContinent = continent
                    uncheckExcept(group, chip)
                } else {
                    selectedContinent = null
                    everywhere.isChecked = true
                }
                refresh()
            })
        }
    }

    private fun buildTypeChips() {
        val group = binding.filterChips
        group.removeAllViews()

        group.addView(makeChip(getString(R.string.favorites_only), checked = false) { chip ->
            favoritesOnly = chip.isChecked
            refresh()
        })

        val allChip = makeChip(getString(R.string.all_types), checked = true) { chip ->
            if (chip.isChecked) {
                selectedType = null
                uncheckTypeChipsExcept(chip)
                refresh()
            } else {
                chip.isChecked = true
            }
        }
        group.addView(allChip)

        SiteType.values().forEach { type ->
            group.addView(makeChip(type.label, checked = false) { chip ->
                if (chip.isChecked) {
                    selectedType = type
                    uncheckTypeChipsExcept(chip)
                } else {
                    selectedType = null
                    allChip.isChecked = true
                }
                refresh()
            })
        }
    }

    /** Type chips behave like a single-selection group; the favorites chip is independent. */
    private fun uncheckTypeChipsExcept(keep: Chip) {
        val group = binding.filterChips
        for (i in 0 until group.childCount) {
            val chip = group.getChildAt(i) as? Chip ?: continue
            if (chip === keep) continue
            if (chip.text == getString(R.string.favorites_only)) continue
            chip.isChecked = false
        }
    }

    private fun uncheckExcept(group: ChipGroup, keep: Chip) {
        for (i in 0 until group.childCount) {
            val chip = group.getChildAt(i) as? Chip ?: continue
            if (chip !== keep) chip.isChecked = false
        }
    }

    private fun makeChip(label: String, checked: Boolean, onToggle: (Chip) -> Unit): Chip {
        val chip = Chip(this)
        chip.text = label
        chip.isCheckable = true
        chip.isChecked = checked
        chip.setOnClickListener { onToggle(chip) }
        return chip
    }

    private fun refresh() {
        val results = SiteData.filter(
            query = query,
            type = selectedType,
            continent = selectedContinent,
            favoritesOnly = favoritesOnly,
            favoriteIds = favorites.ids()
        )
        adapter.submitList(results) { adapter.notifyDataSetChanged() }
        binding.emptyLabel.visibility = if (results.isEmpty()) View.VISIBLE else View.GONE
        binding.countLabel.text = getString(R.string.site_count, results.size)
    }

    override fun onResume() {
        super.onResume()
        // Favourite state may have changed on the detail screen.
        refresh()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        val searchItem = menu.findItem(R.id.action_search)
        val searchView = searchItem.actionView as SearchView
        searchView.queryHint = getString(R.string.search_hint)
        searchView.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(text: String?): Boolean {
                query = text.orEmpty(); refresh(); return true
            }

            override fun onQueryTextChange(text: String?): Boolean {
                query = text.orEmpty(); refresh(); return true
            }
        })
        return true
    }
}
