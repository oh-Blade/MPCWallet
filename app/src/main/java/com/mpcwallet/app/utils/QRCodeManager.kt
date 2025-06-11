package com.mpcwallet.app.utils

import android.graphics.Bitmap
import android.graphics.Color
import com.google.gson.Gson
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import com.mpcwallet.app.data.models.*
import java.util.*
import kotlin.collections.HashMap

/**
 * QR码管理器
 * 用于MPC通信中的数据传输
 */
class QRCodeManager {
    
    companion object {
        private const val MAX_QR_SIZE = 2000 // QR码最大字符数
        private const val QR_CODE_SIZE = 512 // QR码图片大小
        private val gson = Gson()
    }
    
    /**
     * 生成QR码数据
     */
    fun generateQRData(
        type: QRCodeType,
        payload: Any,
        sessionId: String,
        partyId: String
    ): List<QRCodeData> {
        val payloadJson = gson.toJson(payload)
        
        // 如果数据太大，分割成多个QR码
        return if (payloadJson.length > MAX_QR_SIZE) {
            splitIntoMultipleQRs(type, payloadJson, sessionId, partyId)
        } else {
            listOf(
                QRCodeData(
                    type = type,
                    payload = payloadJson,
                    sessionId = sessionId,
                    partyId = partyId
                )
            )
        }
    }
    
    /**
     * 生成密钥生成QR码
     */
    fun generateKeyGenerationQR(
        threshold: Int,
        totalParties: Int,
        chainType: ChainType,
        round: Int,
        sessionId: String,
        partyId: String,
        commitment: String? = null,
        proof: String? = null,
        publicKeyShare: String? = null
    ): List<QRCodeData> {
        val keyGenData = KeyGenerationData(
            threshold = threshold,
            totalParties = totalParties,
            chainType = chainType,
            round = round,
            commitment = commitment,
            proof = proof,
            publicKeyShare = publicKeyShare
        )
        
        val type = when (round) {
            0 -> QRCodeType.KEY_GENERATION_INIT
            1 -> QRCodeType.KEY_GENERATION_ROUND1
            2 -> QRCodeType.KEY_GENERATION_ROUND2
            else -> QRCodeType.KEY_GENERATION_FINAL
        }
        
        return generateQRData(type, keyGenData, sessionId, partyId)
    }
    
    /**
     * 生成签名QR码
     */
    fun generateSigningQR(
        messageHash: String,
        transactionId: String,
        round: Int,
        sessionId: String,
        partyId: String,
        commitment: String? = null,
        partialSignature: String? = null,
        publicNonce: String? = null
    ): List<QRCodeData> {
        val signingData = SigningData(
            messageHash = messageHash,
            transactionId = transactionId,
            round = round,
            commitment = commitment,
            partialSignature = partialSignature,
            publicNonce = publicNonce
        )
        
        val type = when (round) {
            0 -> QRCodeType.SIGN_INIT
            1 -> QRCodeType.SIGN_ROUND1
            2 -> QRCodeType.SIGN_ROUND2
            else -> QRCodeType.SIGN_FINAL
        }
        
        return generateQRData(type, signingData, sessionId, partyId)
    }
    
    /**
     * 生成交易请求QR码
     */
    fun generateTransactionRequestQR(
        toAddress: String,
        amount: String,
        chainType: ChainType,
        sessionId: String,
        partyId: String,
        gasPrice: String? = null,
        gasLimit: String? = null,
        data: String? = null,
        nonce: Long? = null
    ): List<QRCodeData> {
        val txData = TransactionRequestData(
            toAddress = toAddress,
            amount = amount,
            chainType = chainType,
            gasPrice = gasPrice,
            gasLimit = gasLimit,
            data = data,
            nonce = nonce
        )
        
        return generateQRData(QRCodeType.TRANSACTION_REQUEST, txData, sessionId, partyId)
    }
    
    /**
     * 将QR码数据转换为位图
     */
    fun generateQRCodeBitmap(qrData: QRCodeData): Bitmap {
        val qrDataJson = gson.toJson(qrData)
        
        val writer = QRCodeWriter()
        val hints = HashMap<EncodeHintType, Any>().apply {
            put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M)
            put(EncodeHintType.CHARACTER_SET, "UTF-8")
            put(EncodeHintType.MARGIN, 1)
        }
        
        val bitMatrix = writer.encode(qrDataJson, BarcodeFormat.QR_CODE, QR_CODE_SIZE, QR_CODE_SIZE, hints)
        val bitmap = Bitmap.createBitmap(QR_CODE_SIZE, QR_CODE_SIZE, Bitmap.Config.RGB_565)
        
        for (x in 0 until QR_CODE_SIZE) {
            for (y in 0 until QR_CODE_SIZE) {
                bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
            }
        }
        
        return bitmap
    }
    
    /**
     * 解析QR码数据
     */
    fun parseQRData(qrContent: String): QRCodeData? {
        return try {
            gson.fromJson(qrContent, QRCodeData::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * 合并多个QR码数据
     */
    fun combineMultipleQRs(qrDataList: List<QRCodeData>): QRCodeData? {
        if (qrDataList.isEmpty()) return null
        if (qrDataList.size == 1) return qrDataList.first()
        
        // 按序列号排序
        val sortedData = qrDataList.sortedBy { it.sequence }
        
        // 验证序列完整性
        val totalSequences = sortedData.first().totalSequences
        if (sortedData.size != totalSequences) return null
        
        for (i in sortedData.indices) {
            if (sortedData[i].sequence != i + 1) return null
        }
        
        // 合并payload
        val combinedPayload = sortedData.joinToString("") { it.payload }
        
        return sortedData.first().copy(
            payload = combinedPayload,
            sequence = 1,
            totalSequences = 1
        )
    }
    
    /**
     * 解析密钥生成数据
     */
    fun parseKeyGenerationData(qrData: QRCodeData): KeyGenerationData? {
        return try {
            gson.fromJson(qrData.payload, KeyGenerationData::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * 解析签名数据
     */
    fun parseSigningData(qrData: QRCodeData): SigningData? {
        return try {
            gson.fromJson(qrData.payload, SigningData::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * 解析交易请求数据
     */
    fun parseTransactionRequestData(qrData: QRCodeData): TransactionRequestData? {
        return try {
            gson.fromJson(qrData.payload, TransactionRequestData::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    private fun splitIntoMultipleQRs(
        type: QRCodeType,
        payload: String,
        sessionId: String,
        partyId: String
    ): List<QRCodeData> {
        val chunks = payload.chunked(MAX_QR_SIZE)
        return chunks.mapIndexed { index, chunk ->
            QRCodeData(
                type = type,
                payload = chunk,
                sessionId = sessionId,
                partyId = partyId,
                sequence = index + 1,
                totalSequences = chunks.size
            )
        }
    }
} 