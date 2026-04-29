package com.mpcwallet.mobile.wallet

import android.content.Context

class WalletProfileStore(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREFS_NAME = "wallet_profile_store"
        private const val KEY_HAS_WALLET = "has_wallet"
        private const val KEY_THRESHOLD = "threshold"
        private const val KEY_PARTIES = "parties"
        private const val KEY_WALLET_MODE = "wallet_mode"
    }

    data class WalletProfile(
        val hasWallet: Boolean,
        val threshold: Int,
        val parties: Int,
        val mode: String
    )

    /**
     * WHY: Startup routing depends on persistent wallet existence state so users always
     * land in the correct lifecycle step (onboarding vs wallet home).
     */
    fun saveWalletProfile(threshold: Int, parties: Int, mode: String) {
        prefs.edit()
            .putBoolean(KEY_HAS_WALLET, true)
            .putInt(KEY_THRESHOLD, threshold)
            .putInt(KEY_PARTIES, parties)
            .putString(KEY_WALLET_MODE, mode)
            .apply()
    }

    fun getWalletProfile(): WalletProfile {
        return WalletProfile(
            hasWallet = prefs.getBoolean(KEY_HAS_WALLET, false),
            threshold = prefs.getInt(KEY_THRESHOLD, 0),
            parties = prefs.getInt(KEY_PARTIES, 0),
            mode = prefs.getString(KEY_WALLET_MODE, "").orEmpty()
        )
    }
}
