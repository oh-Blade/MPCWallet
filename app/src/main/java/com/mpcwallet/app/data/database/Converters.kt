package com.mpcwallet.app.data.database

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.mpcwallet.app.data.models.ChainType
import com.mpcwallet.app.data.models.TransactionStatus
import com.mpcwallet.app.data.models.MPCSignatureShare

class Converters {
    
    private val gson = Gson()
    
    @TypeConverter
    fun fromChainType(chainType: ChainType): String {
        return chainType.name
    }
    
    @TypeConverter
    fun toChainType(chainType: String): ChainType {
        return ChainType.valueOf(chainType)
    }
    
    @TypeConverter
    fun fromTransactionStatus(status: TransactionStatus): String {
        return status.name
    }
    
    @TypeConverter
    fun toTransactionStatus(status: String): TransactionStatus {
        return TransactionStatus.valueOf(status)
    }
    
    @TypeConverter
    fun fromSignatureShareList(signatures: List<MPCSignatureShare>): String {
        return gson.toJson(signatures)
    }
    
    @TypeConverter
    fun toSignatureShareList(signaturesJson: String): List<MPCSignatureShare> {
        val type = object : TypeToken<List<MPCSignatureShare>>() {}.type
        return gson.fromJson(signaturesJson, type) ?: emptyList()
    }
} 