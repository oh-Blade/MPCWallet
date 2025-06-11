package com.mpcwallet.app.ui.screens.qr

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.mpcwallet.app.data.models.QRCodeData

/**
 * QR码扫描界面
 * 用于扫描MPC通信的二维码
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRScanScreen(
    onNavigateBack: () -> Unit,
    onQRCodeScanned: (QRCodeData) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("扫描二维码", fontWeight = FontWeight.Bold) },
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
                text = "QR码扫描功能正在开发中",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "此功能将允许您扫描其他设备的QR码进行MPC通信",
                style = MaterialTheme.typography.bodyLarge
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(onClick = onNavigateBack) {
                Text("返回")
            }
        }
    }
} 