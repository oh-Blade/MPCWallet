package com.mpcwallet.app.ui.screens.wallet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mpcwallet.app.MPCWalletApplication
import com.mpcwallet.app.data.models.ChainType
import com.mpcwallet.app.ui.components.WalletCard
import com.mpcwallet.app.ui.viewmodels.WalletViewModel

/**
 * 主钱包界面
 * 显示钱包列表、余额和主要操作
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    onNavigateToKeyGeneration: () -> Unit,
    onNavigateToTransaction: () -> Unit,
    onNavigateToQRScan: () -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: WalletViewModel = viewModel()
) {
    val context = LocalContext.current
    val application = context.applicationContext as MPCWalletApplication
    
    LaunchedEffect(Unit) {
        viewModel.initialize(application)
    }
    
    val keyShares by viewModel.keyShares.collectAsState()
    val totalBalance by viewModel.totalBalance.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = "MPC钱包",
                        fontWeight = FontWeight.Bold
                    ) 
                },
                actions = {
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "设置")
                    }
                }
            )
        },
        floatingActionButton = {
            Column {
                FloatingActionButton(
                    onClick = onNavigateToKeyGeneration,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "创建钱包")
                }
                
                FloatingActionButton(
                    onClick = onNavigateToQRScan
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = "扫描二维码")
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // 总余额卡片
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "总余额",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    if (isLoading) {
                        CircularProgressIndicator()
                    } else {
                        Text(
                            text = "$${String.format("%.6f", totalBalance)}",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            
            // 快速操作按钮
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Button(
                    onClick = onNavigateToTransaction,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        Icons.Default.Send,
                        contentDescription = null,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text("发送")
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                OutlinedButton(
                    onClick = { /* 接收功能 */ },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        Icons.Default.CallReceived,
                        contentDescription = null,
                        modifier = Modifier.padding(end = 8.dp)
                    )
                    Text("接收")
                }
            }
            
            // 钱包列表
            Text(
                text = "我的钱包",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            
            if (keyShares.isEmpty()) {
                // 空状态
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.AccountBalanceWallet,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(
                            text = "还没有钱包",
                            style = MaterialTheme.typography.titleMedium,
                            textAlign = TextAlign.Center
                        )
                        
                        Text(
                            text = "点击右下角的 + 按钮创建您的第一个MPC钱包",
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }
            } else {
                // 钱包列表
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(keyShares) { keyShare ->
                        WalletCard(
                            keyShare = keyShare,
                            onCopyAddress = { address ->
                                // TODO: 复制地址到剪贴板
                            },
                            onRefreshBalance = {
                                viewModel.refreshBalance(keyShare)
                            }
                        )
                    }
                }
            }
        }
    }
} 