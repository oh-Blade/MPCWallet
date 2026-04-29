package com.mpcwallet.mobile.wallet

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class InvitePayload(
    @SerialName("sessionId") val sessionId: String,
    @SerialName("threshold") val threshold: Int,
    @SerialName("parties") val parties: Int
)
