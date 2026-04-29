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
        private const val KEY_PENDING_CREATION = "pending_creation"
        private const val KEY_PENDING_SESSION_ID = "pending_session_id"
        private const val KEY_PENDING_THRESHOLD = "pending_threshold"
        private const val KEY_PENDING_PARTIES = "pending_parties"
        private const val KEY_PENDING_JOINED = "pending_joined"
    }

    data class WalletProfile(
        val hasWallet: Boolean,
        val threshold: Int,
        val parties: Int,
        val mode: String
    )

    data class PendingCreation(
        val active: Boolean,
        val sessionId: String,
        val threshold: Int,
        val parties: Int,
        val joinedParties: Int
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

    fun savePendingCreation(sessionId: String, threshold: Int, parties: Int, joinedParties: Int) {
        prefs.edit()
            .putBoolean(KEY_PENDING_CREATION, true)
            .putString(KEY_PENDING_SESSION_ID, sessionId)
            .putInt(KEY_PENDING_THRESHOLD, threshold)
            .putInt(KEY_PENDING_PARTIES, parties)
            .putInt(KEY_PENDING_JOINED, joinedParties)
            .apply()
    }

    fun updatePendingJoinedParties(joinedParties: Int) {
        prefs.edit().putInt(KEY_PENDING_JOINED, joinedParties).apply()
    }

    fun getPendingCreation(): PendingCreation {
        return PendingCreation(
            active = prefs.getBoolean(KEY_PENDING_CREATION, false),
            sessionId = prefs.getString(KEY_PENDING_SESSION_ID, "").orEmpty(),
            threshold = prefs.getInt(KEY_PENDING_THRESHOLD, 0),
            parties = prefs.getInt(KEY_PENDING_PARTIES, 0),
            joinedParties = prefs.getInt(KEY_PENDING_JOINED, 0)
        )
    }

    fun clearPendingCreation() {
        prefs.edit()
            .remove(KEY_PENDING_CREATION)
            .remove(KEY_PENDING_SESSION_ID)
            .remove(KEY_PENDING_THRESHOLD)
            .remove(KEY_PENDING_PARTIES)
            .remove(KEY_PENDING_JOINED)
            .apply()
    }
}
