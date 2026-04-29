package com.mpcwallet.mobile

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import com.mpcwallet.mobile.wallet.WalletProfileStore
import timber.log.Timber

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val profile = WalletProfileStore(this).getWalletProfile()
        val target = if (profile.hasWallet) WalletHomeActivity::class.java else WalletOnboardingActivity::class.java
        startActivity(Intent(this, target))
        finish()
        Timber.i("event=main_routed has_wallet=%s target=%s", profile.hasWallet, target.simpleName)
    }
}
