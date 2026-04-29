package com.mpcwallet.mobile.mpc.model

import kotlinx.serialization.Serializable

@Serializable
data class MpcMessage(
    val sessionId: String,
    val round: Int,
    val senderPartyId: String,
    val receiverPartyId: String?,
    val payloadBase64: String,
    val checksum: String
)

@Serializable
data class QrEnvelope(
    val protocolVersion: Int,
    val envelopeId: String,
    val totalFrames: Int,
    val frameIndex: Int,
    val content: String
)
