package com.mpcwallet.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.common.HybridBinarizer
import com.mpcwallet.mobile.mpc.bridge.DemoGoBridgeGateway
import com.mpcwallet.mobile.mpc.bridge.MobileBridgeContract
import com.mpcwallet.mobile.mpc.bridge.MpcBridgeClient
import com.mpcwallet.mobile.mpc.bridge.QrWireFramePayload
import kotlinx.serialization.json.Json
import timber.log.Timber
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

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
        private const val SCAN_THROTTLE_MS: Long = 1_000L
        private const val FRAME_FRESHNESS_WINDOW_MS: Long = 60_000L
    }

    private val bridgeClient = MpcBridgeClient(DemoGoBridgeGateway())
    private val strictJson = Json { ignoreUnknownKeys = false }

    private lateinit var statusText: TextView
    private lateinit var previewView: PreviewView
    private lateinit var cameraExecutor: ExecutorService
    private var sessionState: ScanSessionState = ScanSessionState.IDLE
    private var ackDeadlineMs: Long = 0L
    private var lastScannedPayload: String = ""
    private var lastScanAtMs: Long = 0L

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
        cameraExecutor = Executors.newSingleThreadExecutor()

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

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    private fun ensureCameraPermissionAndStart() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCameraPreview()
            return
        }
        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }

    /**
     * WHY: Preview + analyzer are bound together so decoded QR payloads enter the same
     * bridge-backed MPC flow used by manual demo paths, keeping behavior consistent.
     */
    private fun startCameraPreview() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()
            val preview = androidx.camera.core.Preview.Builder().build()
            preview.surfaceProvider = previewView.surfaceProvider
            val analysis = ImageAnalysis.Builder().build().apply {
                setAnalyzer(cameraExecutor) { imageProxy ->
                    tryDecodeQr(imageProxy)
                }
            }

            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            cameraProvider.unbindAll()
            cameraProvider.bindToLifecycle(this, selector, preview, analysis)
            sessionState = ScanSessionState.SCANNING
            statusText.text = getString(R.string.status_scan_camera_ready_with_state, sessionState.name)
            Timber.i("event=scan_camera_started status=ok")
        }, ContextCompat.getMainExecutor(this))
    }

    private fun tryDecodeQr(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image ?: run {
            imageProxy.close()
            return
        }
        val buffer = mediaImage.planes.first().buffer
        val bytes = ByteArray(buffer.remaining())
        buffer.get(bytes)

        val source = PlanarYUVLuminanceSource(
            bytes,
            imageProxy.width,
            imageProxy.height,
            0,
            0,
            imageProxy.width,
            imageProxy.height,
            false
        )
        val bitmap = BinaryBitmap(HybridBinarizer(source))
        try {
            val decoded = MultiFormatReader().decode(bitmap).text
            onQrDecoded(decoded)
        } catch (_: Throwable) {
            // Ignore no-result/parse errors and continue scanning.
        } finally {
            imageProxy.close()
        }
    }

    private fun onQrDecoded(rawFrame: String) {
        val nowMs = System.currentTimeMillis()
        if (rawFrame == lastScannedPayload && nowMs - lastScanAtMs < SCAN_THROTTLE_MS) {
            return
        }
        lastScannedPayload = rawFrame
        lastScanAtMs = nowMs
        runOnUiThread {
            statusText.text = getString(R.string.status_scan_qr_detected)
        }
        val validated = validateInboundFrameOrNull(rawFrame, nowMs)
        if (validated == null) {
            return
        }
        processInboundFromScan(rawFrame)
    }

    /**
     * WHY: Scanner input is an untrusted channel; strict frame validation blocks malformed
     * or cross-session payloads before they reach MPC state transitions.
     */
    private fun validateInboundFrameOrNull(rawFrame: String, nowMs: Long): QrWireFramePayload? {
        val decodedFrame = try {
            strictJson.decodeFromString(QrWireFramePayload.serializer(), rawFrame)
        } catch (error: Throwable) {
            Timber.w(error, "event=scan_frame_rejected reason=schema_invalid")
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_invalid_frame, "schema_invalid")
            }
            return null
        }

        if (decodedFrame.protocolVersion != MobileBridgeContract.QR_PROTOCOL_VERSION) {
            Timber.w(
                "event=scan_frame_rejected reason=protocol_mismatch expected=%d actual=%d",
                MobileBridgeContract.QR_PROTOCOL_VERSION,
                decodedFrame.protocolVersion
            )
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_invalid_frame, "protocol_mismatch")
            }
            return null
        }
        if (decodedFrame.sessionId != SESSION_ID) {
            Timber.w(
                "event=scan_frame_rejected reason=session_mismatch expected=%s actual=%s",
                SESSION_ID,
                decodedFrame.sessionId
            )
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_invalid_frame, "session_mismatch")
            }
            return null
        }
        if (decodedFrame.frameId.isBlank()) {
            Timber.w("event=scan_frame_rejected reason=frame_id_empty")
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_invalid_frame, "frame_id_empty")
            }
            return null
        }
        if (kotlin.math.abs(nowMs - decodedFrame.createdAtMs) > FRAME_FRESHNESS_WINDOW_MS) {
            Timber.w(
                "event=scan_frame_rejected reason=frame_stale frame_age_ms=%d",
                nowMs - decodedFrame.createdAtMs
            )
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_invalid_frame, "frame_stale")
            }
            return null
        }
        return decodedFrame
    }

    private fun processInboundFromScan(rawFrame: String) {
        try {
            val inbound = bridgeClient.handleInboundQrFrame(rawFrame)
            val message = when (inbound.type) {
                "payload" -> {
                    sessionState = ScanSessionState.WAITING_ACK
                    ackDeadlineMs = System.currentTimeMillis() + ACK_TIMEOUT_MS
                    if (inbound.ackFrameRaw != null) {
                        bridgeClient.handleInboundQrFrame(inbound.ackFrameRaw)
                        sessionState = ScanSessionState.ACK_RECEIVED
                    }
                    getString(R.string.status_scan_inbound_processed, inbound.type, sessionState.name)
                }
                "ack" -> {
                    sessionState = ScanSessionState.ACK_RECEIVED
                    getString(R.string.status_scan_inbound_processed, inbound.type, sessionState.name)
                }
                else -> getString(R.string.status_scan_inbound_processed, inbound.type, sessionState.name)
            }
            runOnUiThread { statusText.text = message }
        } catch (error: Throwable) {
            Timber.e(error, "event=scan_qr_process_failed")
            runOnUiThread {
                statusText.text = getString(R.string.status_scan_inbound_failed, error.message.orEmpty())
            }
        }
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
