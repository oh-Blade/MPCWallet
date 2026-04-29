package com.mpcwallet.mobile

import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
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
        val statusTextView = TextView(this).apply {
            text = getString(R.string.status_bootstrap)
            textSize = 18f
            setPadding(32, 64, 32, 32)
        }
        val runDemoButton = Button(this).apply {
            text = getString(R.string.action_run_demo_round)
            setOnClickListener {
                statusTextView.text = getString(R.string.status_demo_running)
                Thread {
                    try {
                        val result = runBlocking {
                            coordinator.runDemoRound(sessionId = "demo_session")
                        }
                        runOnUiThread {
                            statusTextView.text = getString(R.string.status_demo_success, result)
                        }
                    } catch (error: Throwable) {
                        Timber.e(error, "event=demo_round_failed")
                        runOnUiThread {
                            statusTextView.text = getString(
                                R.string.status_demo_failed,
                                error.message.orEmpty()
                            )
                        }
                    }
                }.start()
            }
        }

        val rootLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
            addView(runDemoButton)
            addView(statusTextView)
        }
        setContentView(rootLayout)

        Timber.i("event=main_activity_opened status=ok")
    }
}
