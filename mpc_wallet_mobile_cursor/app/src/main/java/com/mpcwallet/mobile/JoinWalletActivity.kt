package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.WalletProfileStore

class JoinWalletActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_join_wallet)

        findViewById<MaterialButton>(R.id.scanInviteButton).setOnClickListener {
            startActivity(Intent(this, ScanSessionActivity::class.java))
        }
        findViewById<MaterialButton>(R.id.confirmJoinButton).setOnClickListener {
            WalletProfileStore(this).saveWalletProfile(threshold = 2, parties = 3, mode = "joiner")
            startActivity(Intent(this, WalletHomeActivity::class.java))
            finish()
        }
    }
}
