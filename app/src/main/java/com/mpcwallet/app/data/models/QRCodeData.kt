package com.mpcwallet.app.data.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class QRCodeData(
    val type: QRCodeType,
    val payload: String,
    val sessionId: String,
    val partyId: String,
    val sequence: Int = 1,
    val totalSequences: Int = 1,
    val timestamp: Long = System.currentTimeMillis()
) : Parcelable

enum class QRCodeType {
    KEY_GENERATION_INIT,    // 密钥生成初始化
    KEY_GENERATION_ROUND1,  // 密钥生成第一轮
    KEY_GENERATION_ROUND2,  // 密钥生成第二轮
    KEY_GENERATION_FINAL,   // 密钥生成完成
    SIGN_INIT,             // 签名初始化
    SIGN_ROUND1,           // 签名第一轮
    SIGN_ROUND2,           // 签名第二轮
    SIGN_FINAL,            // 签名完成
    TRANSACTION_REQUEST,    // 交易请求
    TRANSACTION_RESPONSE,   // 交易响应
    PUBLIC_KEY_SHARE,      // 公钥分片
    ERROR                  // 错误信息
}

@Parcelize
data class KeyGenerationData(
    val threshold: Int,
    val totalParties: Int,
    val chainType: ChainType,
    val round: Int,
    val commitment: String? = null,
    val proof: String? = null,
    val publicKeyShare: String? = null
) : Parcelable

@Parcelize
data class SigningData(
    val messageHash: String,
    val transactionId: String,
    val round: Int,
    val commitment: String? = null,
    val partialSignature: String? = null,
    val publicNonce: String? = null
) : Parcelable

@Parcelize
data class TransactionRequestData(
    val toAddress: String,
    val amount: String,
    val chainType: ChainType,
    val gasPrice: String? = null,
    val gasLimit: String? = null,
    val data: String? = null,
    val nonce: Long? = null
) : Parcelable 