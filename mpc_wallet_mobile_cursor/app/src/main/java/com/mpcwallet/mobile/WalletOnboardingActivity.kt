package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class WalletOnboardingActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_wallet_onboarding)

        findViewById<MaterialButton>(R.id.createWalletButton).setOnClickListener {
            startActivity(Intent(this, CreateWalletActivity::class.java))
        }
        findViewById<MaterialButton>(R.id.joinWalletButton).setOnClickListener {
            startActivity(Intent(this, JoinWalletActivity::class.java))
        }
        findViewById<MaterialButton>(R.id.restoreWalletButton).setOnClickListener {
            startActivity(Intent(this, RestoreWalletActivity::class.java))
        }
    }
}
