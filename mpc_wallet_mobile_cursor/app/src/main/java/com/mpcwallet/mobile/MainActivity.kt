package com.mpcwallet.mobile

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import timber.log.Timber

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val textView = TextView(this).apply {
            text = getString(R.string.status_bootstrap)
            textSize = 18f
            setPadding(32, 64, 32, 32)
        }
        setContentView(textView)

        Timber.i("event=main_activity_opened status=ok")
    }
}
