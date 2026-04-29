package com.mpcwallet.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.mpcwallet.mobile.mpc.bridge.DemoGoBridgeGateway
import com.mpcwallet.mobile.mpc.bridge.MpcBridgeClient
import timber.log.Timber

class ScanSessionActivity : AppCompatActivity() {
    private enum class ScanSessionState {
        IDLE,
        SCANNING,
        WAITING_ACK,
        ACK_RECEIVED,
        RETRY_EXHAUSTED
    }

    companion object {
        private const val SESSION_ID: String = "scan_demo_session"
        private const val FRAME_ID: String = "scan_demo_1"
        private const val ACK_TIMEOUT_MS: Long = 12_000L
    }

    private val bridgeClient = MpcBridgeClient(DemoGoBridgeGateway())

    private lateinit var statusText: TextView
    private lateinit var previewView: PreviewView
    private var sessionState: ScanSessionState = ScanSessionState.IDLE
    private var ackDeadlineMs: Long = 0L

    private val cameraPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                startCameraPreview()
            } else {
                statusText.text = getString(R.string.status_camera_permission_denied)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan_session)

        statusText = findViewById(R.id.scanStatusText)
        previewView = findViewById(R.id.cameraPreview)
        val startScanButton: Button = findViewById(R.id.startScanButton)
        val processDemoFrameButton: Button = findViewById(R.id.processDemoFrameButton)

        startScanButton.setOnClickListener {
            ensureCameraPermissionAndStart()
        }
        processDemoFrameButton.setOnClickListener {
            runDemoInboundProcessing()
        }
    }

    private fun ensureCameraPermissionAndStart() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCameraPreview()
            return
        }
        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }

    /**
     * WHY: CameraX preview binding is introduced now to validate runtime permissions/lifecycle
     * before wiring the real QR analyzer and MPC payload ingestion.
     */
    private fun startCameraPreview() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = androidx.camera.core.Preview.Builder().build()
            preview.surfaceProvider = previewView.surfaceProvider

            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(this, selector, preview)
            sessionState = ScanSessionState.SCANNING
            statusText.text = getString(R.string.status_scan_camera_ready_with_state, sessionState.name)
            Timber.i("event=scan_camera_started status=ok")
        }, ContextCompat.getMainExecutor(this))
    }

    private fun runDemoInboundProcessing() {
        val outboundRaw = bridgeClient.buildQrPayloadFrame(
            sessionId = SESSION_ID,
            frameId = FRAME_ID,
            payload = "demo_round_payload",
            sequence = 1
        )
        sessionState = ScanSessionState.WAITING_ACK
        ackDeadlineMs = System.currentTimeMillis() + ACK_TIMEOUT_MS

        val inbound = bridgeClient.handleInboundQrFrame(outboundRaw)
        val nowMs = System.currentTimeMillis()
        if (sessionState == ScanSessionState.WAITING_ACK && nowMs > ackDeadlineMs) {
            sessionState = ScanSessionState.RETRY_EXHAUSTED
            statusText.text = getString(R.string.status_scan_ack_timeout, sessionState.name)
            return
        }

        if (inbound.type == "payload" && inbound.ackFrameRaw != null) {
            bridgeClient.handleInboundQrFrame(inbound.ackFrameRaw)
            sessionState = ScanSessionState.ACK_RECEIVED
        }

        var retryCount = 0
        while (bridgeClient.nextQrRetry(FRAME_ID).shouldRetry) {
            retryCount += 1
        }
        if (retryCount >= 3) {
            sessionState = ScanSessionState.RETRY_EXHAUSTED
        }

        val retryResponse = bridgeClient.sign(
            sessionId = SESSION_ID,
            messageHashHex = "cd".repeat(32),
            signerIndices = listOf(0, 1)
        )

        val message = when (inbound.type) {
            "payload" -> getString(
                R.string.status_scan_payload_accepted_with_state,
                retryResponse.status,
                sessionState.name
            )
            "ack" -> getString(
                R.string.status_scan_ack_accepted_with_state,
                inbound.acknowledged.orEmpty(),
                sessionState.name
            )
            else -> getString(
                R.string.status_scan_replay_ignored_with_state,
                inbound.frameId,
                sessionState.name
            )
        }
        statusText.text = message
    }
}
