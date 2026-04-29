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
        return mobileSuccess(raw)
    }

    override fun handleInboundQrFrameMobile(raw: String): String {
        return mobileSuccess(raw)
    }

    override fun nextQrRetryMobile(raw: String): String {
        val request = json.decodeFromString(NextRetryRequest.serializer(), raw)
        val current = qrRetries[request.frameId] ?: 0
        val shouldRetry = current < 3
        qrRetries[request.frameId] = current + 1
        return mobileSuccess(json.encodeToString(mapOf("shouldRetry" to shouldRetry)))
    }

    private fun mobileSuccess(data: String): String {
        return json.encodeToString(
            MobileResult.serializer(),
            MobileResult(success = true, data = data)
        )
    }
}

