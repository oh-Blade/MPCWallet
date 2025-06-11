package com.mpcwallet.app.ui.screens.keygen

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * 密钥生成界面
 * 用于创建新的MPC钱包
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KeyGenerationScreen(
    onNavigateBack: () -> Unit,
    onNavigateToQRScan: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("创建MPC钱包", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "密钥生成功能正在开发中",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "此功能将允许您与其他参与方一起生成MPC钱包",
                style = MaterialTheme.typography.bodyLarge
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(onClick = onNavigateToQRScan) {
                Text("扫描QR码参与密钥生成")
            }
        }
    }
} 