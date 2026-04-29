package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.WalletProfileStore

class RestoreWalletActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_restore_wallet)

        findViewById<MaterialButton>(R.id.completeRestoreButton).setOnClickListener {
            WalletProfileStore(this).saveWalletProfile(threshold = 2, parties = 3, mode = "restored")
            startActivity(Intent(this, WalletHomeActivity::class.java))
            finish()
        }
    }
}
