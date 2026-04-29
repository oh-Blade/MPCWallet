package com.mpcwallet.mobile

import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Spinner
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.mpcwallet.mobile.wallet.SessionCoordinationService
import com.mpcwallet.mobile.wallet.WalletProfileStore

class CreateWalletActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_wallet)

        val thresholdSpinner: Spinner = findViewById(R.id.thresholdSpinner)
        val partiesSpinner: Spinner = findViewById(R.id.partiesSpinner)
        thresholdSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            listOf("1", "2", "3")
        )
        partiesSpinner.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            listOf("2", "3", "5")
        )

        findViewById<MaterialButton>(R.id.generateInviteButton).setOnClickListener {
            val threshold = thresholdSpinner.selectedItem.toString().toInt()
            val parties = partiesSpinner.selectedItem.toString().toInt()
            val sessionId = "sess_${System.currentTimeMillis()}"
            SessionCoordinationService.createSession(
                sessionId = sessionId,
                threshold = threshold,
                parties = parties
            )
            WalletProfileStore(this).savePendingCreation(
                sessionId = sessionId,
                threshold = threshold,
                parties = parties,
                joinedParties = 1
            )
            val intent = Intent(this, CreatorSessionActivity::class.java).apply {
                putExtra(CreatorSessionActivity.EXTRA_SESSION_ID, sessionId)
            }
            startActivity(intent)
            finish()
        }
    }
}
