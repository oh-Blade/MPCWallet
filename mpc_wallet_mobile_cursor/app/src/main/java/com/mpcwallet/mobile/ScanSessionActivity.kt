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
import com.mpcwallet.mobile.mpc.qr.OfflineQrTransport
import timber.log.Timber

class ScanSessionActivity : AppCompatActivity() {
    private val qrTransport = OfflineQrTransport()
    private val bridgeClient = MpcBridgeClient(DemoGoBridgeGateway())

    private lateinit var statusText: TextView
    private lateinit var previewView: PreviewView

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
            statusText.text = getString(R.string.status_scan_camera_ready)
            Timber.i("event=scan_camera_started status=ok")
        }, ContextCompat.getMainExecutor(this))
    }

    private fun runDemoInboundProcessing() {
        val frame = OfflineQrTransport.TransportFrame(
            frameId = "scan_demo_1",
            sessionId = "scan_demo_session",
            sequence = 1,
            payload = "demo_round_payload",
            createdAtMs = System.currentTimeMillis()
        )
        val raw = qrTransport.encodeFrame(frame)
        val result = qrTransport.handleInboundFrame(raw)
        val retryResponse = bridgeClient.sign(
            sessionId = "scan_demo_session",
            messageHashHex = "cd".repeat(32),
            signerIndices = listOf(0, 1)
        )

        val message = when (result) {
            is OfflineQrTransport.InboundResult.PayloadAccepted ->
                getString(R.string.status_scan_payload_accepted, retryResponse.status)
            is OfflineQrTransport.InboundResult.AckAccepted ->
                getString(R.string.status_scan_ack_accepted, result.acknowledgedFrameId)
            is OfflineQrTransport.InboundResult.IgnoredReplay ->
                getString(R.string.status_scan_replay_ignored, result.frameId)
        }
        statusText.text = message
    }
}
