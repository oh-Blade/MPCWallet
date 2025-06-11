package com.mpcwallet.app.crypto

import com.mpcwallet.app.data.models.MPCSignatureShare
import com.mpcwallet.app.data.models.MPCTransaction
import com.mpcwallet.app.data.models.ChainType
import org.bouncycastle.crypto.digests.SHA256Digest
import org.bouncycastle.crypto.params.ECDomainParameters
import org.bouncycastle.crypto.signers.ECDSASigner
import org.bouncycastle.crypto.signers.HMacDSAKCalculator
import org.bouncycastle.jce.ECNamedCurveTable
import org.bouncycastle.math.ec.ECPoint
import org.web3j.crypto.Hash
import org.web3j.crypto.RawTransaction
import org.web3j.crypto.TransactionEncoder
import org.web3j.utils.Numeric
import java.math.BigInteger
import java.security.SecureRandom
import android.util.Base64

/**
 * MPC签名器
 * 实现多方计算ECDSA签名
 */
class MPCSigner {
    
    companion object {
        private const val CURVE_NAME = "secp256k1"
    }
    
    private val secureRandom = SecureRandom()
    private val ecSpec = ECNamedCurveTable.getParameterSpec(CURVE_NAME)
    private val ecDomainParams = ECDomainParameters(
        ecSpec.curve, ecSpec.g, ecSpec.n, ecSpec.h
    )
    
    /**
     * 创建交易哈希
     */
    fun createTransactionHash(transaction: MPCTransaction): String {
        return when (transaction.chainType) {
            ChainType.ETHEREUM, ChainType.POLYGON, ChainType.BSC -> {
                createEthereumTransactionHash(transaction)
            }
            ChainType.BITCOIN -> {
                createBitcoinTransactionHash(transaction)
            }
        }
    }
    
    /**
     * 生成签名分片（第一轮）
     */
    fun generateSignatureShare(
        partyId: String,
        messageHash: String,
        keyShare: String,
        nonce: BigInteger? = null
    ): MPCSignatureShare {
        val messageBytes = Numeric.hexStringToByteArray(messageHash)
        val hashBigInt = BigInteger(1, messageBytes)
        
        // 生成或使用提供的随机数k
        val k = nonce ?: generateNonce()
        
        // 计算r = (k * G).x mod n
        val r = ecDomainParams.g.multiply(k).normalize().xCoord.toBigInteger().mod(ecDomainParams.n)
        
        // 这是第一轮的部分签名（简化版本）
        // 实际MPC需要多轮交互
        val partialSig = createPartialSignature(hashBigInt, r, k, keyShare)
        
        return MPCSignatureShare(
            partyId = partyId,
            signature = Base64.encodeToString(partialSig.toByteArray(), Base64.NO_WRAP),
            messageHash = messageHash
        )
    }
    
    /**
     * 合并签名分片
     */
    fun combineSignatures(
        signatureShares: List<MPCSignatureShare>,
        threshold: Int,
        messageHash: String
    ): Pair<BigInteger, BigInteger>? {
        if (signatureShares.size < threshold) {
            return null
        }
        
        // 简化的签名合并
        // 实际实现需要更复杂的MPC协议
        val r = recoverR(signatureShares)
        val s = combinePartialSignatures(signatureShares, threshold)
        
        return Pair(r, s)
    }
    
    /**
     * 验证签名
     */
    fun verifySignature(
        messageHash: String,
        signature: Pair<BigInteger, BigInteger>,
        publicKey: String
    ): Boolean {
        return try {
            val (r, s) = signature
            val messageBytes = Numeric.hexStringToByteArray(messageHash)
            val publicKeyPoint = decodePublicKey(publicKey)
            
            verifyECDSA(messageBytes, r, s, publicKeyPoint)
        } catch (e: Exception) {
            false
        }
    }
    
    private fun createEthereumTransactionHash(transaction: MPCTransaction): String {
        val rawTransaction = RawTransaction.createEtherTransaction(
            transaction.nonce?.toBigInteger() ?: BigInteger.ZERO,
            transaction.gasPrice?.toBigInteger() ?: BigInteger.valueOf(20_000_000_000L), // 20 Gwei
            transaction.gasLimit?.toBigInteger() ?: BigInteger.valueOf(21000L),
            transaction.toAddress,
            transaction.amount.toBigInteger()
        )
        
        val encodedTransaction = TransactionEncoder.encode(rawTransaction)
        val hash = Hash.sha3(encodedTransaction)
        return Numeric.toHexString(hash)
    }
    
    private fun createBitcoinTransactionHash(transaction: MPCTransaction): String {
        // 简化的比特币交易哈希
        // 实际实现需要构建完整的比特币交易
        val data = "${transaction.fromAddress}${transaction.toAddress}${transaction.amount}"
        val hash = Hash.sha3(data.toByteArray())
        return Numeric.toHexString(hash)
    }
    
    private fun generateNonce(): BigInteger {
        val nonceBytes = ByteArray(32)
        secureRandom.nextBytes(nonceBytes)
        return BigInteger(1, nonceBytes).mod(ecDomainParams.n)
    }
    
    private fun createPartialSignature(
        messageHash: BigInteger,
        r: BigInteger,
        k: BigInteger,
        keyShare: String
    ): BigInteger {
        // 简化的部分签名创建
        // s = k^(-1) * (hash + r * private_key_share) mod n
        val privateKeyShare = BigInteger(Base64.decode(keyShare, Base64.NO_WRAP))
        val kInverse = k.modInverse(ecDomainParams.n)
        
        return kInverse.multiply(
            messageHash.add(r.multiply(privateKeyShare))
        ).mod(ecDomainParams.n)
    }
    
    private fun recoverR(signatureShares: List<MPCSignatureShare>): BigInteger {
        // 简化实现：从第一个签名分片恢复r
        // 实际实现需要从所有分片中计算
        return BigInteger.valueOf(123456789L) // 占位符
    }
    
    private fun combinePartialSignatures(
        signatureShares: List<MPCSignatureShare>,
        threshold: Int
    ): BigInteger {
        // 使用Lagrange插值合并部分签名
        var combinedS = BigInteger.ZERO
        
        for (i in 0 until threshold) {
            val share = BigInteger(Base64.decode(signatureShares[i].signature, Base64.NO_WRAP))
            var lagrangeCoeff = BigInteger.ONE
            
            for (j in 0 until threshold) {
                if (i != j) {
                    val xi = BigInteger.valueOf((i + 1).toLong())
                    val xj = BigInteger.valueOf((j + 1).toLong())
                    lagrangeCoeff = lagrangeCoeff.multiply(xj.negate())
                        .multiply(xi.subtract(xj).modInverse(ecDomainParams.n))
                        .mod(ecDomainParams.n)
                }
            }
            
            combinedS = combinedS.add(share.multiply(lagrangeCoeff)).mod(ecDomainParams.n)
        }
        
        return combinedS
    }
    
    private fun decodePublicKey(publicKeyHex: String): ECPoint {
        val publicKeyBytes = Numeric.hexStringToByteArray(publicKeyHex)
        return ecSpec.curve.decodePoint(publicKeyBytes)
    }
    
    private fun verifyECDSA(
        messageHash: ByteArray,
        r: BigInteger,
        s: BigInteger,
        publicKey: ECPoint
    ): Boolean {
        // ECDSA验证
        val signer = ECDSASigner()
        val keyParam = org.bouncycastle.crypto.params.ECPublicKeyParameters(publicKey, ecDomainParams)
        signer.init(false, keyParam)
        
        return signer.verifySignature(messageHash, r, s)
    }
} 