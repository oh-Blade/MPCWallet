package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.WalletProfileStore

class WalletHomeActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_wallet_home)

        val profile = WalletProfileStore(this).getWalletProfile()
        findViewById<TextView>(R.id.walletProfileText).text = getString(
            R.string.status_wallet_profile,
            profile.mode,
            profile.threshold,
            profile.parties
        )

        findViewById<MaterialButton>(R.id.openScanSessionButton).setOnClickListener {
            startActivity(Intent(this, ScanSessionActivity::class.java))
        }
    }
}
