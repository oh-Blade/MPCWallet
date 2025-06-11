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
        // 这里应该安全地存储您的Infura密钥
        // 在生产环境中，请使用更安全的方式管理API密钥
        // 临时使用测试密钥，请替换为您自己的Infura项目ID
        private const val INFURA_KEY = "demo"  // 请替换为真实的Infura项目ID
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
        
        // 其他初始化逻辑
        initializeApplication()
    }
    
    private fun initializeSecurity() {
        // 初始化BouncyCastle提供者（在MPCKeyGenerator中已经初始化）
        // 这里可以添加其他安全相关的初始化
    }
    
    private fun initializeApplication() {
        // 应用程序级别的初始化
        // 例如：日志记录、崩溃报告等
    }
    
    override fun onTerminate() {
        super.onTerminate()
        
        // 清理资源
        ethereumService.close()
    }
} 