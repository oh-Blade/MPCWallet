package com.mpcwallet.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.mpcwallet.app.ui.screens.wallet.WalletScreen
import com.mpcwallet.app.ui.screens.keygen.KeyGenerationScreen
import com.mpcwallet.app.ui.screens.transaction.TransactionScreen
import com.mpcwallet.app.ui.screens.qr.QRScanScreen
import com.mpcwallet.app.ui.screens.settings.SettingsScreen

/**
 * MPC钱包导航系统
 */
@Composable
fun MPCWalletNavigation(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Wallet.route
    ) {
        composable(Screen.Wallet.route) {
            WalletScreen(
                onNavigateToKeyGeneration = {
                    navController.navigate(Screen.KeyGeneration.route)
                },
                onNavigateToTransaction = {
                    navController.navigate(Screen.Transaction.route)
                },
                onNavigateToQRScan = {
                    navController.navigate(Screen.QRScan.route)
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }
        
        composable(Screen.KeyGeneration.route) {
            KeyGenerationScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToQRScan = {
                    navController.navigate(Screen.QRScan.route)
                }
            )
        }
        
        composable(Screen.Transaction.route) {
            TransactionScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToQRScan = {
                    navController.navigate(Screen.QRScan.route)
                }
            )
        }
        
        composable(Screen.QRScan.route) {
            QRScanScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onQRCodeScanned = { qrData ->
                    // 处理扫描结果
                    navController.popBackStack()
                }
            )
        }
        
        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}

sealed class Screen(val route: String) {
    object Wallet : Screen("wallet")
    object KeyGeneration : Screen("key_generation")
    object Transaction : Screen("transaction")
    object QRScan : Screen("qr_scan")
    object Settings : Screen("settings")
} 