package com.mpcwallet.mobile.mpc.bridge

import timber.log.Timber
import java.util.concurrent.atomic.AtomicBoolean

object NativeBridgeLoader {
    private const val LIB_NAME: String = "mpcbridge"
    private val loaded = AtomicBoolean(false)

    /**
     * WHY: JNI loading is centralized so startup failures are surfaced once with clear logs,
     * avoiding partial runtime states across multiple bridge callsites.
     */
    fun ensureLoaded() {
        if (loaded.get()) {
            return
        }
        synchronized(this) {
            if (loaded.get()) {
                return
            }
            try {
                System.loadLibrary(LIB_NAME)
                loaded.set(true)
                Timber.i("event=native_bridge_loaded lib=%s", LIB_NAME)
            } catch (error: UnsatisfiedLinkError) {
                Timber.e(error, "event=native_bridge_load_failed lib=%s", LIB_NAME)
                throw error
            }
        }
    }
}
