package com.mpcwallet.mobile.wallet

import java.util.concurrent.ConcurrentHashMap

object SessionCoordinationService {
    data class SessionState(
        val sessionId: String,
        val threshold: Int,
        val parties: Int,
        val joinedParties: Int
    )

    private val sessions = ConcurrentHashMap<String, SessionState>()

    /**
     * WHY: Session coordination must be shared by creator/join flows so progress updates
     * can be observed consistently before final wallet materialization.
     */
    fun createSession(sessionId: String, threshold: Int, parties: Int): SessionState {
        val state = SessionState(
            sessionId = sessionId,
            threshold = threshold,
            parties = parties,
            joinedParties = 1
        )
        sessions[sessionId] = state
        return state
    }

    fun getSession(sessionId: String): SessionState? = sessions[sessionId]

    fun incrementJoin(sessionId: String): SessionState? {
        val current = sessions[sessionId] ?: return null
        val updated = current.copy(joinedParties = (current.joinedParties + 1).coerceAtMost(current.parties))
        sessions[sessionId] = updated
        return updated
    }
}
