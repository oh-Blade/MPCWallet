package com.mpcwallet.mobile.mpc.bridge

import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap

class DemoGoBridgeGateway : GoBridgeGateway {
    private val json = Json { ignoreUnknownKeys = true }
    private val sessionPublicKeys = ConcurrentHashMap<String, String>()
    private val qrRetries = ConcurrentHashMap<String, Int>()

    override fun startKeygenMobile(raw: String): String {
        val request = json.decodeFromString(StartKeygenRequestPayload.serializer(), raw)
        val publicKey = "04" + "11".repeat(64)
        sessionPublicKeys[request.sessionId] = publicKey
        val response = StartKeygenResponsePayload(
            sessionId = request.sessionId,
            status = MobileBridgeContract.STATUS_READY,
            totalParties = request.totalParties,
            threshold = request.threshold,
            publicKeyHex = publicKey,
            signerIndices = listOf(0, 1, 2)
        )
        return mobileSuccess(json.encodeToString(StartKeygenResponsePayload.serializer(), response))
    }

    override fun signTransactionMobile(raw: String): String {
        val request = json.decodeFromString(SignRequestPayload.serializer(), raw)
        val response = SignResponsePayload(
            sessionId = request.sessionId,
            status = MobileBridgeContract.STATUS_SIGNED,
            messageHashHex = request.messageHashHex,
            signatureHex = "aa".repeat(65),
            signatureRecoveryHex = "1b",
            rHex = "bb".repeat(32),
            sHex = "cc".repeat(32)
        )
        return mobileSuccess(json.encodeToString(SignResponsePayload.serializer(), response))
    }

    override fun buildQrPayloadFrameMobile(raw: String): String {
        val request = json.decodeFromString(BuildQrFrameRequest.serializer(), raw)
        val frame = QrWireFramePayload(
            sessionId = request.sessionId,
            frameId = request.frameId,
            sequence = request.sequence,
            payload = request.payload,
            ackFor = "",
            createdAtMs = System.currentTimeMillis(),
            protocolVersion = MobileBridgeContract.QR_PROTOCOL_VERSION
        )
        return mobileSuccess(json.encodeToString(QrWireFramePayload.serializer(), frame))
    }

    override fun handleInboundQrFrameMobile(raw: String): String {
        val request = json.decodeFromString(HandleQrFrameRequest.serializer(), raw)
        val ackFrame = json.encodeToString(
            QrWireFramePayload.serializer(),
            QrWireFramePayload(
                sessionId = "scan_demo_session",
                frameId = "ack_demo_1",
                sequence = 1,
                payload = "",
                ackFor = "scan_demo_1",
                createdAtMs = System.currentTimeMillis(),
                protocolVersion = MobileBridgeContract.QR_PROTOCOL_VERSION
            )
        )
        val inbound = QrInboundResultPayload(
            type = if (request.rawFrame.contains("\"ackFor\":\"\"")) "payload" else "ack",
            frameId = "scan_demo_1",
            ackFrameRaw = ackFrame,
            acknowledged = "scan_demo_1",
            shouldProcess = true
        )
        return mobileSuccess(json.encodeToString(QrInboundResultPayload.serializer(), inbound))
    }

    override fun nextQrRetryMobile(raw: String): String {
        val request = json.decodeFromString(NextRetryRequest.serializer(), raw)
        val current = qrRetries[request.frameId] ?: 0
        val shouldRetry = current < 3
        qrRetries[request.frameId] = current + 1
        return mobileSuccess(
            json.encodeToString(
                RetryDecisionPayload.serializer(),
                RetryDecisionPayload(shouldRetry = shouldRetry)
            )
        )
    }

    private fun mobileSuccess(data: String): String {
        return json.encodeToString(
            MobileResult.serializer(),
            MobileResult(success = true, data = data)
        )
    }
}

