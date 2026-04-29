package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.SessionCoordinationService
import com.mpcwallet.mobile.wallet.WalletProfileStore

class JoinWalletActivity : AppCompatActivity() {
    private var scannedSessionId: String = ""

    private val scanLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == RESULT_OK) {
                scannedSessionId = result.data?.getStringExtra(ScanSessionActivity.EXTRA_SESSION_ID).orEmpty()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_join_wallet)

        findViewById<MaterialButton>(R.id.scanInviteButton).setOnClickListener {
            val pending = WalletProfileStore(this).getPendingCreation()
            val sessionId = pending.sessionId.ifBlank { "scan_demo_session" }
            val intent = Intent(this, ScanSessionActivity::class.java).apply {
                putExtra(ScanSessionActivity.EXTRA_SESSION_ID, sessionId)
                putExtra(ScanSessionActivity.EXTRA_SCAN_MODE, ScanSessionActivity.MODE_JOIN)
            }
            scanLauncher.launch(intent)
        }
        findViewById<MaterialButton>(R.id.confirmJoinButton).setOnClickListener {
            val store = WalletProfileStore(this)
            val pending = store.getPendingCreation()
            if (pending.active && scannedSessionId == pending.sessionId) {
                store.incrementPendingJoinedParties(scannedSessionId)
                SessionCoordinationService.incrementJoin(scannedSessionId)
            }
            val threshold = if (pending.threshold > 0) pending.threshold else 2
            val parties = if (pending.parties > 0) pending.parties else 3
            store.saveWalletProfile(threshold = threshold, parties = parties, mode = "joiner")
            startActivity(Intent(this, WalletHomeActivity::class.java))
            finish()
        }
    }
}
