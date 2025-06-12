package com.mpcwallet.app

import android.app.Application
import androidx.room.Room
import com.mpcwallet.app.data.database.MPCWalletDatabase
import com.mpcwallet.app.crypto.MPCKeyGenerator
import com.mpcwallet.app.crypto.MPCSigner
import com.mpcwallet.app.network.EthereumService
import com.mpcwallet.app.utils.QRCodeManager

/**
 * MPC钱包应用程序类
 * 初始化应用程序级别的组件
 */
class MPCWalletApplication : Application() {
    
    companion object {
        // 从BuildConfig读取配置，支持不同环境
        val INFURA_KEY: String = BuildConfig.INFURA_API_KEY
        val INFURA_PROJECT_ID: String = BuildConfig.INFURA_PROJECT_ID  
        val DEFAULT_NETWORK: String = BuildConfig.DEFAULT_NETWORK
        val ENABLE_DEBUG_LOGGING: Boolean = BuildConfig.ENABLE_DEBUG_LOGGING
        val ENABLE_BIOMETRIC: Boolean = BuildConfig.ENABLE_BIOMETRIC
        val MIN_PASSWORD_LENGTH: Int = BuildConfig.MIN_PASSWORD_LENGTH
        val BUILD_TYPE: String = BuildConfig.BUILD_TYPE_NAME
        val API_BASE_URL: String = BuildConfig.API_BASE_URL
    }
    
    // 数据库实例
    val database by lazy {
        Room.databaseBuilder(
            applicationContext,
            MPCWalletDatabase::class.java,
            "mpc_wallet_database"
        ).build()
    }
    
    // MPC相关服务
    val mpcKeyGenerator by lazy { MPCKeyGenerator() }
    val mpcSigner by lazy { MPCSigner() }
    val qrCodeManager by lazy { QRCodeManager() }
    
    // 网络服务
    val ethereumService by lazy { 
        EthereumService(INFURA_KEY)
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // 初始化安全提供者
        initializeSecurity()
        
        // 初始化应用程序
        initializeApplication()
        
        // 打印配置信息（仅在调试模式）
        if (ENABLE_DEBUG_LOGGING) {
            logConfiguration()
        }
    }
    
    private fun initializeSecurity() {
        // 初始化BouncyCastle提供者（在MPCKeyGenerator中已经初始化）
        // 这里可以添加其他安全相关的初始化
    }
    
    private fun initializeApplication() {
        // 应用程序级别的初始化
        // 例如：日志记录、崩溃报告等
    }
    
    private fun logConfiguration() {
        android.util.Log.d("MPCWallet", """
            |=== MPC Wallet Configuration ===
            |Build Type: $BUILD_TYPE
            |Default Network: $DEFAULT_NETWORK  
            |API Base URL: $API_BASE_URL
            |Debug Logging: $ENABLE_DEBUG_LOGGING
            |Biometric Enabled: $ENABLE_BIOMETRIC
            |Min Password Length: $MIN_PASSWORD_LENGTH
            |Infura Key: ${INFURA_KEY.take(8)}...
            |================================
        """.trimMargin())
    }
    
    override fun onTerminate() {
        super.onTerminate()
        
        // 清理资源
        ethereumService.close()
    }
} 