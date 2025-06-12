package com.mpcwallet.app.utils

import com.mpcwallet.app.BuildConfig

/**
 * 配置管理器
 * 提供统一的配置访问接口，支持不同环境配置
 */
object ConfigManager {
    
    // =============================================================================
    // API配置
    // =============================================================================
    
    /**
     * Infura API密钥
     */
    val infuraApiKey: String = BuildConfig.INFURA_API_KEY
    
    /**
     * Infura项目ID  
     */
    val infuraProjectId: String = BuildConfig.INFURA_PROJECT_ID
    
    /**
     * API基础URL
     */
    val apiBaseUrl: String = BuildConfig.API_BASE_URL
    
    // =============================================================================
    // 网络配置
    // =============================================================================
    
    /**
     * 默认网络
     */
    val defaultNetwork: String = BuildConfig.DEFAULT_NETWORK
    
    /**
     * 是否为主网环境
     */
    val isMainnet: Boolean = defaultNetwork == "mainnet"
    
    /**
     * 是否为测试网环境
     */
    val isTestnet: Boolean = !isMainnet
    
    // =============================================================================
    // 应用配置
    // =============================================================================
    
    /**
     * 是否启用调试日志
     */
    val isDebugLoggingEnabled: Boolean = BuildConfig.ENABLE_DEBUG_LOGGING
    
    /**
     * 构建类型
     */
    val buildType: String = BuildConfig.BUILD_TYPE_NAME
    
    /**
     * 是否为调试构建
     */
    val isDebugBuild: Boolean = buildType == "debug"
    
    /**
     * 是否为发布构建
     */
    val isReleaseBuild: Boolean = buildType == "release"
    
    // =============================================================================
    // 安全配置
    // =============================================================================
    
    /**
     * 是否启用生物识别
     */
    val isBiometricEnabled: Boolean = BuildConfig.ENABLE_BIOMETRIC
    
    /**
     * 最小密码长度
     */
    val minPasswordLength: Int = BuildConfig.MIN_PASSWORD_LENGTH
    
    // =============================================================================
    // 工具方法
    // =============================================================================
    
    /**
     * 获取完整的Infura URL
     */
    fun getInfuraUrl(network: String = defaultNetwork): String {
        return when (network.lowercase()) {
            "mainnet" -> "https://mainnet.infura.io/v3/$infuraApiKey"
            "sepolia" -> "https://sepolia.infura.io/v3/$infuraApiKey"
            "polygon" -> "https://polygon-mainnet.infura.io/v3/$infuraApiKey"
            "mumbai" -> "https://polygon-mumbai.infura.io/v3/$infuraApiKey"
            else -> "https://sepolia.infura.io/v3/$infuraApiKey"
        }
    }
    
    /**
     * 获取网络名称显示
     */
    fun getNetworkDisplayName(network: String = defaultNetwork): String {
        return when (network.lowercase()) {
            "mainnet" -> "以太坊主网"
            "sepolia" -> "Sepolia测试网"
            "polygon" -> "Polygon主网"
            "mumbai" -> "Mumbai测试网"
            else -> "未知网络"
        }
    }
    
    /**
     * 验证配置是否有效
     */
    fun validateConfiguration(): Boolean {
        return infuraApiKey.isNotBlank() && 
               infuraApiKey != "demo_key" &&
               infuraProjectId.isNotBlank() &&
               infuraProjectId != "demo_project"
    }
    
    /**
     * 获取配置摘要信息
     */
    fun getConfigSummary(): String {
        return """
            |=== MPC Wallet 配置摘要 ===
            |构建类型: $buildType
            |网络环境: ${getNetworkDisplayName()}
            |API地址: $apiBaseUrl
            |调试模式: $isDebugLoggingEnabled
            |生物识别: $isBiometricEnabled
            |配置有效: ${validateConfiguration()}
            |========================
        """.trimMargin()
    }
} 