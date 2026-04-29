package com.mpcwallet.mobile.mpc.engine

import com.mpcwallet.mobile.mpc.model.MpcMessage

interface TssEngine {
    suspend fun startKeygen(sessionId: String, totalParties: Int, threshold: Int): List<MpcMessage>
    suspend fun handleInboundMessage(message: MpcMessage): List<MpcMessage>
    suspend fun sign(sessionId: String, signPayloadHex: String): List<MpcMessage>
    suspend fun exportPublicKey(sessionId: String): String
}
