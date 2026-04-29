package com.mpcwallet.mobile

import android.app.Application
import timber.log.Timber

class MpcWalletApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Timber.plant(Timber.DebugTree())
        Timber.i(
            "event=app_bootstrap status=ok build_type=%s",
            BuildConfig.BUILD_TYPE
        )
    }
}
