package com.mpcwallet.mobile.mpc.workflow

import com.mpcwallet.mobile.mpc.bridge.MpcBridgeClient
import com.mpcwallet.mobile.mpc.engine.TssLibBridgeEngine
import com.mpcwallet.mobile.mpc.qr.OfflineQrTransport

class MpcSessionCoordinator(
    private val tssEngine: TssLibBridgeEngine,
    private val qrTransport: OfflineQrTransport,
    private val bridgeClient: MpcBridgeClient
) {
    /**
     * WHY: Keep a deterministic single-call demo flow that validates engine + QR state transitions
     * before integrating camera scanning and real peer networking.
     */
    suspend fun runDemoRound(sessionId: String): String {
        val builder = StringBuilder()

        tssEngine.startKeygen(sessionId, totalParties = 3, threshold = 1)
        val publicKey = tssEngine.exportPublicKey(sessionId)
        builder.append("keygen=ok pkLen=${publicKey.length}; ")

        val outbound = OfflineQrTransport.TransportFrame(
            frameId = "${sessionId}_frame_1",
            sessionId = sessionId,
            sequence = 1,
            payload = "round1_payload",
            createdAtMs = System.currentTimeMillis()
        )
        val rawOutbound = qrTransport.encodeFrame(outbound)
        qrTransport.recordOutboundFrame(outbound.frameId)

        when (val inboundResult = qrTransport.handleInboundFrame(rawOutbound)) {
            is OfflineQrTransport.InboundResult.PayloadAccepted -> {
                builder.append("qrPayload=accepted; ")
                qrTransport.handleInboundFrame(inboundResult.ackFrame)
                builder.append("qrAck=accepted; ")
            }
            is OfflineQrTransport.InboundResult.AckAccepted -> {
                builder.append("qrAck=direct; ")
            }
            is OfflineQrTransport.InboundResult.IgnoredReplay -> {
                builder.append("qrReplay=ignored; ")
            }
        }

        var retries = 0
        while (qrTransport.nextRetry("timeout_frame")) {
            retries += 1
        }
        builder.append("retryCount=$retries; ")

        val signResult = bridgeClient.sign(
            sessionId = sessionId,
            messageHashHex = "ab".repeat(32),
            signerIndices = listOf(0, 1)
        )
        builder.append("sign=${signResult.status} sigLen=${signResult.signatureHex.length}")
        return builder.toString()
    }
}

