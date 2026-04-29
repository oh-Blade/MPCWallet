package com.mpcwallet.mobile.mpc.engine

import com.mpcwallet.mobile.mpc.bridge.MobileBridgeContract
import com.mpcwallet.mobile.mpc.bridge.MpcBridgeClient
import com.mpcwallet.mobile.mpc.model.MpcMessage
import timber.log.Timber

class TssLibBridgeEngine(
    private val bridgeClient: MpcBridgeClient = MpcBridgeClient()
) : TssEngine {
    private val sessionPublicKeys = mutableMapOf<String, String>()

    /**
     * WHY: This class isolates protocol engine dependencies and keeps Android business
     * logic independent from the Go runtime binding details.
     */
    override suspend fun startKeygen(
        sessionId: String,
        totalParties: Int,
        threshold: Int
    ): List<MpcMessage> {
        require(totalParties > 1) { "totalParties must be > 1" }
        require(threshold in 1 until totalParties) { "threshold must be in [1, totalParties-1]" }

        val response = bridgeClient.startKeygen(sessionId, totalParties, threshold)
        require(response.status == MobileBridgeContract.STATUS_READY) {
            "unexpected keygen status: ${response.status}"
        }
        sessionPublicKeys[sessionId] = response.publicKeyHex
        Timber.i("event=tss_keygen_ready session_id=%s signers=%d", sessionId, response.signerIndices.size)
        return emptyList()
    }

    override suspend fun handleInboundMessage(message: MpcMessage): List<MpcMessage> {
        Timber.i(
            "event=tss_inbound_handled session_id=%s round=%d sender=%s",
            message.sessionId,
            message.round,
            message.senderPartyId
        )
        return emptyList()
    }

    override suspend fun sign(sessionId: String, signPayloadHex: String): List<MpcMessage> {
        require(signPayloadHex.startsWith("0x")) { "signPayloadHex must start with 0x" }
        val sanitizedHex = signPayloadHex.removePrefix("0x")
        val response = bridgeClient.sign(sessionId, sanitizedHex, emptyList())
        require(response.status == MobileBridgeContract.STATUS_SIGNED) {
            "unexpected sign status: ${response.status}"
        }
        Timber.i("event=tss_sign_finished session_id=%s signature_len=%d", sessionId, response.signatureHex.length)
        return emptyList()
    }

    override suspend fun exportPublicKey(sessionId: String): String {
        val publicKey = sessionPublicKeys[sessionId].orEmpty()
        Timber.i("event=tss_export_pubkey session_id=%s key_len=%d", sessionId, publicKey.length)
        return publicKey
    }
}
