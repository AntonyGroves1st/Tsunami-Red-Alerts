package com.redalert.tsunami

import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Verifies the bottom footer menu exists, is wired, and reflects a selected state.
 * Uses `create()` only so the periodic network refresh never runs; SDK 30 skips
 * the API 33+ notification-permission prompt.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class FooterMenuTest {

    private fun glyphColor(item: LinearLayout) =
        (item.getChildAt(0) as TextView).currentTextColor

    @Test
    fun footerStartsWithStatusSelected() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        val scan = ContextCompat.getColor(activity, R.color.scan)
        val muted = ContextCompat.getColor(activity, R.color.text_secondary)

        assertEquals(scan, glyphColor(activity.findViewById(R.id.footerStatus)))
        assertEquals(muted, glyphColor(activity.findViewById(R.id.footerQuakes)))
    }

    @Test
    fun tappingFooterItemMovesSelection() {
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()
        val scan = ContextCompat.getColor(activity, R.color.scan)
        val muted = ContextCompat.getColor(activity, R.color.text_secondary)

        activity.findViewById<LinearLayout>(R.id.footerWater).performClick()

        assertEquals(scan, glyphColor(activity.findViewById(R.id.footerWater)))
        assertEquals(muted, glyphColor(activity.findViewById(R.id.footerStatus)))
    }
}
