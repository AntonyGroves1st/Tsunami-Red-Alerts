package com.hiddencities.atlas

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.hiddencities.atlas.databinding.ItemSiteBinding

class SiteAdapter(
    private val isFavorite: (String) -> Boolean,
    private val onClick: (HiddenSite) -> Unit
) : ListAdapter<HiddenSite, SiteAdapter.SiteHolder>(DIFF) {

    inner class SiteHolder(val binding: ItemSiteBinding) :
        RecyclerView.ViewHolder(binding.root) {
        init {
            binding.root.setOnClickListener {
                val pos = bindingAdapterPosition
                if (pos != RecyclerView.NO_POSITION) onClick(getItem(pos))
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SiteHolder {
        val binding = ItemSiteBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SiteHolder(binding)
    }

    override fun onBindViewHolder(holder: SiteHolder, position: Int) {
        val site = getItem(position)
        with(holder.binding) {
            siteName.text = site.name
            siteLocation.text = "${site.region} · ${site.country}"
            siteType.text = site.type.label
            siteShort.text = site.shortDesc
            favIcon.setImageResource(
                if (isFavorite(site.id)) R.drawable.ic_star else R.drawable.ic_star_border
            )
        }
    }

    private companion object {
        val DIFF = object : DiffUtil.ItemCallback<HiddenSite>() {
            override fun areItemsTheSame(a: HiddenSite, b: HiddenSite) = a.id == b.id
            override fun areContentsTheSame(a: HiddenSite, b: HiddenSite) = a == b
        }
    }
}
