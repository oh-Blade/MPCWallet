package com.mpcwallet.mobile

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import android.content.Intent
import com.mpcwallet.mobile.mpc.bridge.DemoGoBridgeGateway
import com.mpcwallet.mobile.mpc.bridge.MpcBridgeClient
import com.mpcwallet.mobile.mpc.engine.TssLibBridgeEngine
import com.mpcwallet.mobile.mpc.qr.OfflineQrTransport
import com.mpcwallet.mobile.mpc.workflow.MpcSessionCoordinator
import kotlinx.coroutines.runBlocking
import timber.log.Timber

class MainActivity : AppCompatActivity() {
    private val coordinator: MpcSessionCoordinator by lazy {
        val bridgeClient = MpcBridgeClient(DemoGoBridgeGateway())
        val engine = TssLibBridgeEngine(bridgeClient)
        MpcSessionCoordinator(
            tssEngine = engine,
            qrTransport = OfflineQrTransport(),
            bridgeClient = bridgeClient
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val statusTextView: TextView = findViewById(R.id.statusTextView)
        findViewById<com.google.android.material.button.MaterialButton>(R.id.runHealthCheckButton)
            .setOnClickListener {
                statusTextView.text = getString(R.string.status_protocol_check_running)
                Thread {
                    try {
                        val result = runBlocking {
                            coordinator.runDemoRound(sessionId = "health_check_session")
                        }
                        runOnUiThread {
                            statusTextView.text = getString(R.string.status_protocol_check_success, result)
                        }
                    } catch (error: Throwable) {
                        Timber.e(error, "event=protocol_check_failed")
                        runOnUiThread {
                            statusTextView.text = getString(
                                R.string.status_protocol_check_failed,
                                error.message.orEmpty()
                            )
                        }
                    }
                }.start()
            }

        findViewById<com.google.android.material.button.MaterialButton>(R.id.openScanSessionButton)
            .setOnClickListener {
                startActivity(Intent(this@MainActivity, ScanSessionActivity::class.java))
            }

        Timber.i("event=main_activity_opened status=ok")
    }
}
