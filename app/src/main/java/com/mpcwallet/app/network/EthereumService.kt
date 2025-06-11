package com.mpcwallet.app.network

import com.mpcwallet.app.data.models.ChainType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.web3j.crypto.RawTransaction
import org.web3j.crypto.Sign
import org.web3j.crypto.TransactionEncoder
import org.web3j.protocol.Web3j
import org.web3j.protocol.core.DefaultBlockParameterName
import org.web3j.protocol.core.methods.response.*
import org.web3j.protocol.http.HttpService
import org.web3j.utils.Convert
import org.web3j.utils.Numeric
import java.math.BigDecimal
import java.math.BigInteger

/**
 * 以太坊服务
 * 通过Infura API与以太坊网络交互
 */
class EthereumService(private val infuraKey: String) {
    
    companion object {
        private const val MAINNET_URL = "https://mainnet.infura.io/v3/"
        private const val SEPOLIA_URL = "https://sepolia.infura.io/v3/"
        private const val POLYGON_URL = "https://polygon-mainnet.infura.io/v3/"
        private const val BSC_URL = "https://bsc-dataseed.binance.org/"
        
        private val GAS_PRICE_DEFAULT = BigInteger.valueOf(20_000_000_000L) // 20 Gwei
        private val GAS_LIMIT_DEFAULT = BigInteger.valueOf(21000L)
    }
    
    private val web3jClients = mutableMapOf<ChainType, Web3j>()
    
    init {
        initializeClients()
    }
    
    private fun initializeClients() {
        web3jClients[ChainType.ETHEREUM] = Web3j.build(HttpService(SEPOLIA_URL + infuraKey))
        web3jClients[ChainType.POLYGON] = Web3j.build(HttpService(POLYGON_URL + infuraKey))
        web3jClients[ChainType.BSC] = Web3j.build(HttpService(BSC_URL))
    }
    
    private fun getWeb3j(chainType: ChainType): Web3j {
        return web3jClients[chainType] ?: throw IllegalArgumentException("Unsupported chain type: $chainType")
    }
    
    /**
     * 获取余额
     */
    suspend fun getBalance(address: String, chainType: ChainType): BigDecimal {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val balance = web3j.ethGetBalance(address, DefaultBlockParameterName.LATEST)
                    .send()
                    .balance
                
                Convert.fromWei(BigDecimal(balance), Convert.Unit.ETHER)
            } catch (e: Exception) {
                BigDecimal.ZERO
            }
        }
    }
    
    /**
     * 获取交易数量（nonce）
     */
    suspend fun getTransactionCount(address: String, chainType: ChainType): BigInteger {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                web3j.ethGetTransactionCount(address, DefaultBlockParameterName.LATEST)
                    .send()
                    .transactionCount
            } catch (e: Exception) {
                BigInteger.ZERO
            }
        }
    }
    
    /**
     * 获取当前Gas价格
     */
    suspend fun getGasPrice(chainType: ChainType): BigInteger {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                web3j.ethGasPrice().send().gasPrice
            } catch (e: Exception) {
                GAS_PRICE_DEFAULT
            }
        }
    }
    
    /**
     * 估算Gas限制
     */
    suspend fun estimateGas(
        from: String,
        to: String,
        value: BigInteger,
        data: String?,
        chainType: ChainType
    ): BigInteger {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val transaction = org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                    from, to, data
                )
                transaction.value = value
                
                web3j.ethEstimateGas(transaction).send().amountUsed
            } catch (e: Exception) {
                GAS_LIMIT_DEFAULT
            }
        }
    }
    
    /**
     * 广播已签名的交易
     */
    suspend fun sendRawTransaction(signedTransaction: String, chainType: ChainType): String? {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val response = web3j.ethSendRawTransaction(signedTransaction).send()
                
                if (response.hasError()) {
                    throw Exception("Transaction failed: ${response.error.message}")
                }
                
                response.transactionHash
            } catch (e: Exception) {
                null
            }
        }
    }
    
    /**
     * 获取交易详情
     */
    suspend fun getTransaction(txHash: String, chainType: ChainType): Transaction? {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val response = web3j.ethGetTransactionByHash(txHash).send()
                response.transaction.orElse(null)
            } catch (e: Exception) {
                null
            }
        }
    }
    
    /**
     * 获取交易回执
     */
    suspend fun getTransactionReceipt(txHash: String, chainType: ChainType): TransactionReceipt? {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val response = web3j.ethGetTransactionReceipt(txHash).send()
                response.transactionReceipt.orElse(null)
            } catch (e: Exception) {
                null
            }
        }
    }
    
    /**
     * 创建原始交易
     */
    fun createRawTransaction(
        nonce: BigInteger,
        gasPrice: BigInteger,
        gasLimit: BigInteger,
        to: String,
        value: BigInteger,
        data: String? = null
    ): RawTransaction {
        return if (data.isNullOrEmpty()) {
            RawTransaction.createEtherTransaction(
                nonce, gasPrice, gasLimit, to, value
            )
        } else {
            RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, to, value, data
            )
        }
    }
    
    /**
     * 使用MPC签名对交易进行签名
     */
    fun signTransaction(
        rawTransaction: RawTransaction,
        r: BigInteger,
        s: BigInteger,
        v: Byte,
        chainType: ChainType
    ): String {
        val chainId = getChainId(chainType)
        val signatureData = Sign.SignatureData(v, r.toByteArray(), s.toByteArray())
        val encodedTransaction = TransactionEncoder.encode(rawTransaction, signatureData)
        return Numeric.toHexString(encodedTransaction)
    }
    
    /**
     * 获取链ID
     */
    private fun getChainId(chainType: ChainType): Long {
        return when (chainType) {
            ChainType.ETHEREUM -> 11155111L // Sepolia testnet
            ChainType.POLYGON -> 137L // Polygon mainnet
            ChainType.BSC -> 56L // BSC mainnet
            else -> 1L // Ethereum mainnet fallback
        }
    }
    
    /**
     * 验证地址格式
     */
    fun isValidAddress(address: String): Boolean {
        return try {
            address.startsWith("0x") && address.length == 42 && 
            address.substring(2).all { it.isDigit() || it.lowercaseChar() in 'a'..'f' }
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * 格式化金额（Wei转ETH）
     */
    fun weiToEth(wei: BigInteger): BigDecimal {
        return Convert.fromWei(BigDecimal(wei), Convert.Unit.ETHER)
    }
    
    /**
     * 格式化金额（ETH转Wei）
     */
    fun ethToWei(eth: BigDecimal): BigInteger {
        return Convert.toWei(eth, Convert.Unit.ETHER).toBigInteger()
    }
    
    /**
     * 获取网络信息
     */
    suspend fun getNetworkInfo(chainType: ChainType): NetworkInfo? {
        return withContext(Dispatchers.IO) {
            try {
                val web3j = getWeb3j(chainType)
                val blockNumber = web3j.ethBlockNumber().send().blockNumber
                val gasPrice = web3j.ethGasPrice().send().gasPrice
                val chainId = web3j.ethChainId().send().chainId
                
                NetworkInfo(
                    chainType = chainType,
                    blockNumber = blockNumber,
                    gasPrice = gasPrice,
                    chainId = chainId
                )
            } catch (e: Exception) {
                null
            }
        }
    }
    
    fun close() {
        web3jClients.values.forEach { it.shutdown() }
        web3jClients.clear()
    }
}

data class NetworkInfo(
    val chainType: ChainType,
    val blockNumber: BigInteger,
    val gasPrice: BigInteger,
    val chainId: BigInteger
) 