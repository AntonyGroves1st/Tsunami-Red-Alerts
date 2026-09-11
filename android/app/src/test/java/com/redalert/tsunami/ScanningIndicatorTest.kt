package com.redalert.tsunami

import android.view.View
import android.widget.Button
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * Verifies the top-of-screen SCANNING indicator tracks the 24/7 watch state.
 * Uses `create()` only (not resume) so the periodic network refresh never runs.
 * SDK 30 avoids the API 33+ notification-permission prompt in onCreate.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class ScanningIndicatorTest {

    @After
    fun tearDown() {
        WatchService.isRunning = false
    }

    @Test
    fun scanningIndicatorHiddenWhenWatchIdle() {
        WatchService.isRunning = false
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()

        val indicator = activity.findViewById<View>(R.id.scanningIndicator)
        assertEquals(View.GONE, indicator.visibility)
    }

    @Test
    fun scanningIndicatorShownWhenWatchAlreadyRunning() {
        WatchService.isRunning = true
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()

        val indicator = activity.findViewById<View>(R.id.scanningIndicator)
        assertEquals(View.VISIBLE, indicator.visibility)
    }

    @Test
    fun watchButtonTogglesScanningIndicator() {
        WatchService.isRunning = false
        val activity = Robolectric.buildActivity(MainActivity::class.java).create().get()

        val indicator = activity.findViewById<View>(R.id.scanningIndicator)
        val watchButton = activity.findViewById<Button>(R.id.watchButton)

        assertEquals(View.GONE, indicator.visibility)

        watchButton.performClick()
        assertEquals(View.VISIBLE, indicator.visibility)
        assertEquals(activity.getString(R.string.stop_watch), watchButton.text.toString())

        watchButton.performClick()
        assertEquals(View.GONE, indicator.visibility)
        assertEquals(activity.getString(R.string.start_watch), watchButton.text.toString())
    }
}
