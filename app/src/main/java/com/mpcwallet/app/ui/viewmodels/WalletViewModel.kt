package com.mpcwallet.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mpcwallet.app.MPCWalletApplication
import com.mpcwallet.app.data.models.MPCKeyShare
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.math.BigDecimal

/**
 * 钱包界面ViewModel
 */
class WalletViewModel : ViewModel() {
    
    private lateinit var application: MPCWalletApplication
    
    private val _keyShares = MutableStateFlow<List<MPCKeyShare>>(emptyList())
    val keyShares: StateFlow<List<MPCKeyShare>> = _keyShares.asStateFlow()
    
    private val _totalBalance = MutableStateFlow(BigDecimal.ZERO)
    val totalBalance: StateFlow<BigDecimal> = _totalBalance.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    fun initialize(app: MPCWalletApplication) {
        application = app
        loadKeyShares()
    }
    
    private fun loadKeyShares() {
        viewModelScope.launch {
            try {
                application.database.keyShareDao().getAllKeyShares().collect { shares ->
                    _keyShares.value = shares
                    updateTotalBalance(shares)
                }
            } catch (e: Exception) {
                _error.value = "加载钱包失败: ${e.message}"
            }
        }
    }
    
    private fun updateTotalBalance(shares: List<MPCKeyShare>) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                var total = BigDecimal.ZERO
                
                shares.forEach { share ->
                    val balance = application.ethereumService.getBalance(
                        share.address, 
                        share.chainType
                    )
                    total = total.add(balance)
                }
                
                _totalBalance.value = total
            } catch (e: Exception) {
                _error.value = "获取余额失败: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun refreshBalance(keyShare: MPCKeyShare) {
        viewModelScope.launch {
            try {
                val balance = application.ethereumService.getBalance(
                    keyShare.address,
                    keyShare.chainType
                )
                // 这里可以更新单个钱包的余额显示
                // 由于MPCKeyShare模型中没有余额字段，这里只是演示
            } catch (e: Exception) {
                _error.value = "刷新余额失败: ${e.message}"
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
} 