package com.mpcwallet.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.mpcwallet.app.data.models.MPCKeyShare
import com.mpcwallet.app.data.models.ChainType

/**
 * 钱包卡片组件
 * 显示单个钱包的信息
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletCard(
    keyShare: MPCKeyShare,
    onCopyAddress: (String) -> Unit,
    onRefreshBalance: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // 顶部：链类型和设置按钮
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // 链图标
                    Icon(
                        imageVector = getChainIcon(keyShare.chainType),
                        contentDescription = null,
                        tint = getChainColor(keyShare.chainType),
                        modifier = Modifier.size(24.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    // 链名称
                    Text(
                        text = getChainDisplayName(keyShare.chainType),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                // 刷新按钮
                IconButton(onClick = onRefreshBalance) {
                    Icon(
                        Icons.Default.Refresh,
                        contentDescription = "刷新余额"
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // 地址
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "地址:",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    text = formatAddress(keyShare.address),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                
                IconButton(
                    onClick = { onCopyAddress(keyShare.address) },
                    modifier = Modifier.size(24.dp)
                ) {
                    Icon(
                        Icons.Default.ContentCopy,
                        contentDescription = "复制地址",
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            
            // MPC信息
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "阈值: ${keyShare.threshold}/${keyShare.totalParties}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                
                if (keyShare.isBackedUp) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.CloudDone,
                            contentDescription = "已备份",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "已备份",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "未备份",
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "未备份",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }
    }
}

private fun getChainIcon(chainType: ChainType) = when (chainType) {
    ChainType.ETHEREUM -> Icons.Default.Diamond
    ChainType.BITCOIN -> Icons.Default.CurrencyBitcoin
    ChainType.POLYGON -> Icons.Default.Polyline
    ChainType.BSC -> Icons.Default.Circle
}

private fun getChainColor(chainType: ChainType) = when (chainType) {
    ChainType.ETHEREUM -> androidx.compose.ui.graphics.Color(0xFF627EEA)
    ChainType.BITCOIN -> androidx.compose.ui.graphics.Color(0xFFF7931A)
    ChainType.POLYGON -> androidx.compose.ui.graphics.Color(0xFF8247E5)
    ChainType.BSC -> androidx.compose.ui.graphics.Color(0xFFF0B90B)
}

private fun getChainDisplayName(chainType: ChainType) = when (chainType) {
    ChainType.ETHEREUM -> "以太坊"
    ChainType.BITCOIN -> "比特币"
    ChainType.POLYGON -> "Polygon"
    ChainType.BSC -> "币安智能链"
}

private fun formatAddress(address: String): String {
    return if (address.length > 10) {
        "${address.take(6)}...${address.takeLast(4)}"
    } else {
        address
    }
} 