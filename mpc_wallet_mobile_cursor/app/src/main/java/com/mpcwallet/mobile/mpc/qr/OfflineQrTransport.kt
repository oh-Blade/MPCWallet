package com.mpcwallet.mobile.mpc.qr

import com.mpcwallet.mobile.mpc.bridge.MobileBridgeContract
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import timber.log.Timber

class OfflineQrTransport(
    private val maxRetryCount: Int = DEFAULT_MAX_RETRY_COUNT,
    private val replayTtlMs: Long = DEFAULT_REPLAY_TTL_MS
) {
    companion object {
        const val DEFAULT_MAX_RETRY_COUNT: Int = 3
        const val DEFAULT_REPLAY_TTL_MS: Long = 120_000L
    }

    private val json = Json { ignoreUnknownKeys = true }
    private val seenFrameTimestamps = LinkedHashMap<String, Long>()
    private val outboundRetries = mutableMapOf<String, Int>()

    @Serializable
    data class TransportFrame(
        val frameId: String,
        val sessionId: String,
        val sequence: Int,
        val payload: String,
        val ackForFrameId: String? = null,
        val createdAtMs: Long,
        val protocolVersion: Int = MobileBridgeContract.QR_PROTOCOL_VERSION
    )

    sealed class InboundResult {
        data class PayloadAccepted(val frame: TransportFrame, val ackFrame: String) : InboundResult()
        data class AckAccepted(val acknowledgedFrameId: String) : InboundResult()
        data class IgnoredReplay(val frameId: String) : InboundResult()
    }

    /**
     * WHY: QR is an unstable offline transport; retries and explicit ACK tracking reduce
     * user-facing stalls during multi-round MPC exchanges.
     */
    fun recordOutboundFrame(frameId: String) {
        outboundRetries[frameId] = 0
        Timber.i("event=qr_outbound_recorded frame_id=%s", frameId)
    }

    fun nextRetry(frameId: String): Boolean {
        val current = outboundRetries[frameId] ?: return false
        if (current >= maxRetryCount) {
            Timber.w("event=qr_retry_exhausted frame_id=%s max_retry=%d", frameId, maxRetryCount)
            return false
        }
        outboundRetries[frameId] = current + 1
        Timber.i("event=qr_retry_scheduled frame_id=%s retry_count=%d", frameId, current + 1)
        return true
    }

    fun encodeFrame(frame: TransportFrame): String {
        return json.encodeToString(TransportFrame.serializer(), frame)
    }

    /**
     * WHY: replay filtering must happen before handing bytes to TSS parser to avoid
     * cross-session frame injection and protocol desynchronization.
     */
    fun handleInboundFrame(raw: String, nowMs: Long = System.currentTimeMillis()): InboundResult {
        cleanupExpiredFrames(nowMs)
        val frame = json.decodeFromString(TransportFrame.serializer(), raw)
        require(frame.protocolVersion == MobileBridgeContract.QR_PROTOCOL_VERSION) {
            "unsupported qr protocol version: ${frame.protocolVersion}"
        }

        if (frame.ackForFrameId != null) {
            outboundRetries.remove(frame.ackForFrameId)
            Timber.i("event=qr_ack_received frame_id=%s", frame.ackForFrameId)
            return InboundResult.AckAccepted(frame.ackForFrameId)
        }

        if (seenFrameTimestamps.containsKey(frame.frameId)) {
            Timber.w("event=qr_replay_detected frame_id=%s session_id=%s", frame.frameId, frame.sessionId)
            return InboundResult.IgnoredReplay(frame.frameId)
        }

        seenFrameTimestamps[frame.frameId] = nowMs
        val ack = TransportFrame(
            frameId = "${frame.frameId}_ack",
            sessionId = frame.sessionId,
            sequence = frame.sequence,
            payload = "",
            ackForFrameId = frame.frameId,
            createdAtMs = nowMs,
            protocolVersion = MobileBridgeContract.QR_PROTOCOL_VERSION
        )
        val ackEncoded = encodeFrame(ack)
        Timber.i("event=qr_payload_accepted frame_id=%s session_id=%s", frame.frameId, frame.sessionId)
        return InboundResult.PayloadAccepted(frame, ackEncoded)
    }

    private fun cleanupExpiredFrames(nowMs: Long) {
        val iterator = seenFrameTimestamps.entries.iterator()
        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (nowMs - entry.value > replayTtlMs) {
                iterator.remove()
            }
        }
    }
}
