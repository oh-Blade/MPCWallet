package com.mpcwallet.app.data.models

import android.os.Parcelable
import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.parcelize.Parcelize

@Parcelize
@Entity(tableName = "mpc_key_shares")
data class MPCKeyShare(
    @PrimaryKey
    val id: String,
    val partyId: String,
    val keyShareData: String, // 加密后的密钥分片
    val publicKey: String,
    val address: String,
    val chainType: ChainType,
    val threshold: Int,
    val totalParties: Int,
    val createdAt: Long = System.currentTimeMillis(),
    val isBackedUp: Boolean = false
) : Parcelable

@Parcelize
data class MPCSignatureShare(
    val partyId: String,
    val signature: String,
    val messageHash: String,
    val timestamp: Long = System.currentTimeMillis()
) : Parcelable

@Parcelize
data class MPCTransaction(
    val id: String,
    val fromAddress: String,
    val toAddress: String,
    val amount: String,
    val gasPrice: String? = null,
    val gasLimit: String? = null,
    val nonce: Long? = null,
    val data: String? = null,
    val chainType: ChainType,
    val status: TransactionStatus,
    val signatures: List<MPCSignatureShare> = emptyList(),
    val requiredSignatures: Int,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) : Parcelable

enum class ChainType {
    ETHEREUM,
    BITCOIN,
    POLYGON,
    BSC
}

enum class TransactionStatus {
    PENDING,
    SIGNING,
    SIGNED,
    BROADCASTING,
    CONFIRMED,
    FAILED
} 