package com.mpcwallet.mobile.mpc.bridge

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object MobileBridgeContract {
    const val STATUS_READY: String = "ready"
    const val STATUS_SIGNED: String = "signed"
    const val QR_PROTOCOL_VERSION: Int = 1
}

@Serializable
data class MobileResult(
    val success: Boolean,
    val data: String? = null,
    val error: String? = null
)

@Serializable
data class StartKeygenRequestPayload(
    @SerialName("sessionId") val sessionId: String,
    @SerialName("totalParties") val totalParties: Int,
    @SerialName("threshold") val threshold: Int
)

@Serializable
data class StartKeygenResponsePayload(
    @SerialName("sessionId") val sessionId: String,
    val status: String,
    @SerialName("totalParties") val totalParties: Int,
    @SerialName("threshold") val threshold: Int,
    @SerialName("publicKeyHex") val publicKeyHex: String,
    @SerialName("signerIndices") val signerIndices: List<Int>
)

@Serializable
data class SignRequestPayload(
    @SerialName("sessionId") val sessionId: String,
    @SerialName("messageHashHex") val messageHashHex: String,
    @SerialName("signerIndices") val signerIndices: List<Int>
)

@Serializable
data class SignResponsePayload(
    @SerialName("sessionId") val sessionId: String,
    val status: String,
    @SerialName("messageHashHex") val messageHashHex: String,
    @SerialName("signatureHex") val signatureHex: String,
    @SerialName("signatureRecoveryHex") val signatureRecoveryHex: String,
    @SerialName("rHex") val rHex: String,
    @SerialName("sHex") val sHex: String
)

@Serializable
data class NextRetryRequest(
    @SerialName("frameId") val frameId: String
)

@Serializable
data class BuildQrFrameRequest(
    @SerialName("sessionId") val sessionId: String,
    @SerialName("frameId") val frameId: String,
    @SerialName("payload") val payload: String,
    @SerialName("sequence") val sequence: Int
)

@Serializable
data class HandleQrFrameRequest(
    @SerialName("rawFrame") val rawFrame: String
)

@Serializable
data class QrInboundResultPayload(
    @SerialName("type") val type: String,
    @SerialName("frameId") val frameId: String,
    @SerialName("ackFrameRaw") val ackFrameRaw: String? = null,
    @SerialName("acknowledged") val acknowledged: String? = null,
    @SerialName("shouldProcess") val shouldProcess: Boolean
)

@Serializable
data class RetryDecisionPayload(
    @SerialName("shouldRetry") val shouldRetry: Boolean
)

@Serializable
data class QrWireFramePayload(
    @SerialName("sessionId") val sessionId: String,
    @SerialName("frameId") val frameId: String,
    @SerialName("sequence") val sequence: Int,
    @SerialName("payload") val payload: String,
    @SerialName("ackFor") val ackFor: String,
    @SerialName("createdAtMs") val createdAtMs: Long,
    @SerialName("protocolVersion") val protocolVersion: Int
)
