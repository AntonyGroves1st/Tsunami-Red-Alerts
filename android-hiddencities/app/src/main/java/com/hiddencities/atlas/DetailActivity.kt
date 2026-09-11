package com.hiddencities.atlas

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hiddencities.atlas.databinding.ActivityDetailBinding

class DetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDetailBinding
    private lateinit var favorites: Favorites
    private lateinit var site: HiddenSite

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val id = intent.getStringExtra(EXTRA_SITE_ID)
        val found = id?.let { SiteData.byId(it) }
        if (found == null) {
            finish(); return
        }
        site = found
        favorites = Favorites(this)

        binding.toolbar.title = site.name
        binding.toolbar.setNavigationOnClickListener { finish() }

        bind()
        updateFavButton()

        binding.mapButton.setOnClickListener { openMaps() }
        binding.favButton.setOnClickListener {
            val nowFav = favorites.toggle(site.id)
            updateFavButton()
            Toast.makeText(
                this,
                if (nowFav) R.string.favorite_added else R.string.favorite_removed,
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun bind() {
        binding.detailName.text = site.name
        binding.detailAka.text = site.aka?.let { "also known as $it" } ?: ""
        binding.detailAka.visibility = if (site.aka == null) android.view.View.GONE else android.view.View.VISIBLE
        binding.detailLocation.text = "${site.region} · ${site.country} · ${site.continent}"
        binding.detailType.text = site.type.label
        binding.detailDescription.text = site.description

        fillRow(binding.rowEntrance, getString(R.string.entrance_label), site.entranceHint)
        fillRow(binding.rowAccess, getString(R.string.access_label), site.access.label)
        fillRow(binding.rowDepth, getString(R.string.depth_label), site.depthNote)
        fillRow(binding.rowEra, getString(R.string.era_label), site.era)

        binding.rowCoords.rowLabel.text = getString(R.string.coords_label)
        binding.rowCoords.rowValue.text = "${site.coordinateString()}  (tap to copy)"
        binding.rowCoords.root.setOnClickListener { copyCoordinates() }
    }

    private fun fillRow(
        row: com.hiddencities.atlas.databinding.RowDetailBinding,
        label: String,
        value: String
    ) {
        row.rowLabel.text = label
        row.rowValue.text = value
    }

    private fun updateFavButton() {
        val fav = favorites.isFavorite(site.id)
        binding.favButton.setIconResource(
            if (fav) R.drawable.ic_star else R.drawable.ic_star_border
        )
        binding.favButton.text = if (fav) getString(R.string.favorites_only) else "Save"
    }

    private fun openMaps() {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(site.geoUri()))
        if (intent.resolveActivity(packageManager) != null) {
            startActivity(intent)
        } else {
            // Fall back to a browser-based map when no map app is installed.
            val web = "https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}"
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(web)))
        }
    }

    private fun copyCoordinates() {
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText(site.name, site.coordinateString()))
        Toast.makeText(this, R.string.coords_copied, Toast.LENGTH_SHORT).show()
    }

    companion object {
        const val EXTRA_SITE_ID = "site_id"
    }
}
