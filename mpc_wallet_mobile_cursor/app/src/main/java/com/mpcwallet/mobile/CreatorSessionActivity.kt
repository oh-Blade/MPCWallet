package com.mpcwallet.mobile

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.zxing.BarcodeFormat
import com.google.zxing.MultiFormatWriter
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.InvitePayload
import com.mpcwallet.mobile.wallet.SessionCoordinationService
import com.mpcwallet.mobile.wallet.WalletProfileStore
import kotlinx.serialization.json.Json

class CreatorSessionActivity : AppCompatActivity() {
    companion object {
        const val EXTRA_SESSION_ID: String = "extra_session_id"
    }

    private lateinit var store: WalletProfileStore
    private lateinit var inviteCodeText: TextView
    private lateinit var inviteQrImage: ImageView
    private lateinit var sessionStateText: TextView
    private lateinit var completeButton: MaterialButton
    private val json = Json { ignoreUnknownKeys = true }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_creator_session)
        store = WalletProfileStore(this)
        inviteCodeText = findViewById(R.id.inviteCodeText)
        inviteQrImage = findViewById(R.id.inviteQrImage)
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
        val sessionState = SessionCoordinationService.getSession(pending.sessionId)
        if (sessionState != null && sessionState.joinedParties != pending.joinedParties) {
            store.updatePendingJoinedParties(sessionState.joinedParties)
        }
        val updatedPending = store.getPendingCreation()
        val invitePayload = InvitePayload(
            sessionId = updatedPending.sessionId,
            threshold = updatedPending.threshold,
            parties = updatedPending.parties
        )
        inviteQrImage.setImageBitmap(renderQrBitmap(json.encodeToString(InvitePayload.serializer(), invitePayload)))
        inviteCodeText.text = getString(R.string.status_creator_invite_code, updatedPending.sessionId)
        sessionStateText.text = getString(
            R.string.status_creator_session_progress,
            updatedPending.sessionId,
            updatedPending.joinedParties,
            updatedPending.parties,
            updatedPending.threshold
        )
        completeButton.isEnabled = updatedPending.active && updatedPending.joinedParties >= updatedPending.parties
    }

    private fun renderQrBitmap(content: String): Bitmap {
        val size = 600
        val bitMatrix = MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, size, size)
        val pixels = IntArray(size * size)
        for (y in 0 until size) {
            for (x in 0 until size) {
                pixels[y * size + x] = if (bitMatrix[x, y]) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
            }
        }
        return Bitmap.createBitmap(pixels, size, size, Bitmap.Config.ARGB_8888)
    }
}
