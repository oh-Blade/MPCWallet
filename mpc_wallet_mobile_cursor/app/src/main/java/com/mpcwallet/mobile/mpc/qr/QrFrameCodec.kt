package com.mpcwallet.mobile.mpc.qr

import com.mpcwallet.mobile.mpc.model.QrEnvelope
import kotlinx.serialization.json.Json
import timber.log.Timber
import java.util.UUID

class QrFrameCodec(
    private val protocolVersion: Int = 1,
    private val maxFrameContentBytes: Int = DEFAULT_MAX_FRAME_BYTES
) {
    companion object {
        const val DEFAULT_MAX_FRAME_BYTES: Int = 700
    }

    private val json = Json { ignoreUnknownKeys = true }

    /**
     * WHY: MPC round payload can exceed single-QR capacity and must be chunked deterministically
     * so participants can reconstruct exactly the same byte stream before signature verification.
     */
    fun encode(rawPayload: String): List<String> {
        require(maxFrameContentBytes > 0) { "maxFrameContentBytes must be positive" }

        val envelopeId = UUID.randomUUID().toString()
        val chunks = rawPayload.chunked(maxFrameContentBytes)
        val totalFrames = chunks.size

        Timber.i(
            "event=qr_encode_started envelope_id=%s total_frames=%d max_frame_bytes=%d",
            envelopeId,
            totalFrames,
            maxFrameContentBytes
        )

        return chunks.mapIndexed { idx, content ->
            val envelope = QrEnvelope(
                protocolVersion = protocolVersion,
                envelopeId = envelopeId,
                totalFrames = totalFrames,
                frameIndex = idx,
                content = content
            )
            json.encodeToString(QrEnvelope.serializer(), envelope)
        }
    }

    /**
     * WHY: Strict validation here prevents malicious frame injection or replay mixing across sessions.
     */
    fun decode(frames: List<String>): String {
        require(frames.isNotEmpty()) { "frames must not be empty" }
        val envelopes = frames.map { json.decodeFromString(QrEnvelope.serializer(), it) }
        val first = envelopes.first()

        require(envelopes.all { it.protocolVersion == first.protocolVersion }) {
            "protocol version mismatch"
        }
        require(envelopes.all { it.envelopeId == first.envelopeId }) {
            "envelope id mismatch"
        }
        require(envelopes.size == first.totalFrames) {
            "incomplete frame set"
        }

        val ordered = envelopes.sortedBy { it.frameIndex }
        require(ordered.map { it.frameIndex } == (0 until first.totalFrames).toList()) {
            "frame index sequence invalid"
        }

        Timber.i(
            "event=qr_decode_completed envelope_id=%s total_frames=%d",
            first.envelopeId,
            first.totalFrames
        )
        return ordered.joinToString(separator = "") { it.content }
    }
}
