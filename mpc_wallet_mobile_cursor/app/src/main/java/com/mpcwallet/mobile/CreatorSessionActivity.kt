package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.WalletProfileStore

class CreatorSessionActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_SESSION_ID: String = "extra_session_id"
    }

    private lateinit var store: WalletProfileStore
    private lateinit var inviteCodeText: TextView
    private lateinit var sessionStateText: TextView
    private lateinit var completeButton: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_creator_session)
        store = WalletProfileStore(this)
        inviteCodeText = findViewById(R.id.inviteCodeText)
        sessionStateText = findViewById(R.id.sessionStateText)
        completeButton = findViewById(R.id.completeCreationButton)

        findViewById<MaterialButton>(R.id.refreshStatusButton).setOnClickListener {
            renderSessionState()
        }

        completeButton.setOnClickListener {
            val pending = store.getPendingCreation()
            if (pending.joinedParties >= pending.parties && pending.active) {
                store.saveWalletProfile(
                    threshold = pending.threshold,
                    parties = pending.parties,
                    mode = "creator"
                )
                store.clearPendingCreation()
                startActivity(Intent(this, WalletHomeActivity::class.java))
                finish()
            }
        }

        renderSessionState()
    }

    override fun onResume() {
        super.onResume()
        renderSessionState()
    }

    /**
     * WHY: Creator must wait for participant quorum before finalizing wallet material,
     * otherwise lifecycle flow is misleading and unsafe for production use.
     */
    private fun renderSessionState() {
        val pending = store.getPendingCreation()
        inviteCodeText.text = getString(R.string.status_creator_invite_code, pending.sessionId)
        sessionStateText.text = getString(
            R.string.status_creator_session_progress,
            pending.sessionId,
            pending.joinedParties,
            pending.parties,
            pending.threshold
        )
        completeButton.isEnabled = pending.active && pending.joinedParties >= pending.parties
    }
}
