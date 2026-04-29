package com.mpcwallet.mobile

import android.app.Application
import timber.log.Timber

class MpcWalletApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Timber.plant(Timber.DebugTree())
        val isDebugBuild = (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
        Timber.i(
            "event=app_bootstrap status=ok is_debug=%s package=%s",
            isDebugBuild,
            packageName
        )
    }
}
