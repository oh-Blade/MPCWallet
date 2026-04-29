package com.mpcwallet.mobile.mpc.bridge

import kotlinx.serialization.json.Json
import timber.log.Timber

class MpcBridgeClient(
    private val goBridge: GoBridgeGateway = LocalGoBridgeGateway()
) {
    private val json = Json { ignoreUnknownKeys = true }

    /**
     * WHY: This client centralizes mobile<->Go response validation so all protocol
     * invocations share one strict error-handling path.
     */
    fun startKeygen(sessionId: String, totalParties: Int, threshold: Int): StartKeygenResponsePayload {
        val payload = StartKeygenRequestPayload(
            sessionId = sessionId,
            totalParties = totalParties,
            threshold = threshold
        )
        val rawRequest = json.encodeToString(StartKeygenRequestPayload.serializer(), payload)
        val rawResult = goBridge.startKeygenMobile(rawRequest)
        val result = decodeMobileResult(rawResult)
        val data = result.data ?: error("missing startKeygen response data")
        val parsed = json.decodeFromString(StartKeygenResponsePayload.serializer(), data)
        Timber.i(
            "event=bridge_keygen_completed session_id=%s status=%s signer_count=%d",
            parsed.sessionId,
            parsed.status,
            parsed.signerIndices.size
        )
        return parsed
    }

    fun sign(sessionId: String, messageHashHex: String, signerIndices: List<Int>): SignResponsePayload {
        val payload = SignRequestPayload(
            sessionId = sessionId,
            messageHashHex = messageHashHex,
            signerIndices = signerIndices
        )
        val rawRequest = json.encodeToString(SignRequestPayload.serializer(), payload)
        val rawResult = goBridge.signTransactionMobile(rawRequest)
        val result = decodeMobileResult(rawResult)
        val data = result.data ?: error("missing sign response data")
        val parsed = json.decodeFromString(SignResponsePayload.serializer(), data)
        Timber.i(
            "event=bridge_sign_completed session_id=%s status=%s sig_len=%d",
            parsed.sessionId,
            parsed.status,
            parsed.signatureHex.length
        )
        return parsed
    }

    fun buildQrPayloadFrame(sessionId: String, frameId: String, payload: String, sequence: Int): String {
        val request = BuildQrFrameRequest(
            sessionId = sessionId,
            frameId = frameId,
            payload = payload,
            sequence = sequence
        )
        val rawRequest = json.encodeToString(BuildQrFrameRequest.serializer(), request)
        val rawResult = goBridge.buildQrPayloadFrameMobile(rawRequest)
        val result = decodeMobileResult(rawResult)
        return result.data ?: error("missing buildQrPayloadFrame response data")
    }

    fun handleInboundQrFrame(rawFrame: String): QrInboundResultPayload {
        val request = HandleQrFrameRequest(rawFrame = rawFrame)
        val rawRequest = json.encodeToString(HandleQrFrameRequest.serializer(), request)
        val rawResult = goBridge.handleInboundQrFrameMobile(rawRequest)
        val result = decodeMobileResult(rawResult)
        val data = result.data ?: error("missing handleInboundQrFrame response data")
        return json.decodeFromString(QrInboundResultPayload.serializer(), data)
    }

    fun nextQrRetry(frameId: String): RetryDecisionPayload {
        val request = NextRetryRequest(frameId = frameId)
        val rawRequest = json.encodeToString(NextRetryRequest.serializer(), request)
        val rawResult = goBridge.nextQrRetryMobile(rawRequest)
        val result = decodeMobileResult(rawResult)
        val data = result.data ?: error("missing nextQrRetry response data")
        return json.decodeFromString(RetryDecisionPayload.serializer(), data)
    }

    private fun decodeMobileResult(rawResult: String): MobileResult {
        val result = json.decodeFromString(MobileResult.serializer(), rawResult)
        if (!result.success) {
            val message = result.error ?: "unknown bridge error"
            Timber.e("event=bridge_call_failed reason=%s", message)
            error(message)
        }
        return result
    }
}

interface GoBridgeGateway {
    fun startKeygenMobile(raw: String): String
    fun signTransactionMobile(raw: String): String
    fun buildQrPayloadFrameMobile(raw: String): String
    fun handleInboundQrFrameMobile(raw: String): String
    fun nextQrRetryMobile(raw: String): String
}

class LocalGoBridgeGateway : GoBridgeGateway {
    override fun startKeygenMobile(raw: String): String {
        NativeBridgeLoader.ensureLoaded()
        return NativeBridgeRuntime.startKeygen(raw)
    }

    override fun signTransactionMobile(raw: String): String {
        NativeBridgeLoader.ensureLoaded()
        return NativeBridgeRuntime.sign(raw)
    }

    override fun buildQrPayloadFrameMobile(raw: String): String {
        NativeBridgeLoader.ensureLoaded()
        return NativeBridgeRuntime.buildQrPayloadFrame(raw)
    }

    override fun handleInboundQrFrameMobile(raw: String): String {
        NativeBridgeLoader.ensureLoaded()
        return NativeBridgeRuntime.handleInboundQrFrame(raw)
    }

    override fun nextQrRetryMobile(raw: String): String {
        NativeBridgeLoader.ensureLoaded()
        return NativeBridgeRuntime.nextQrRetry(raw)
    }
}

object NativeBridgeRuntime {
    fun startKeygen(raw: String): String {
        // WHY: keep this explicit crash so integration failures are visible in QA immediately.
        error("Native bridge not linked yet. Bind gomobile output and wire runtime loader.")
    }

    fun sign(raw: String): String {
        error("Native bridge not linked yet. Bind gomobile output and wire runtime loader.")
    }

    fun buildQrPayloadFrame(raw: String): String {
        error("Native bridge not linked yet. Bind gomobile output and wire runtime loader.")
    }

    fun handleInboundQrFrame(raw: String): String {
        error("Native bridge not linked yet. Bind gomobile output and wire runtime loader.")
    }

    fun nextQrRetry(raw: String): String {
        error("Native bridge not linked yet. Bind gomobile output and wire runtime loader.")
    }
}
