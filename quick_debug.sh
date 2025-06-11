#!/bin/bash

# 快速调试命令集合
echo "⚡ 快速调试命令"
echo "=============="

echo ""
echo "选择调试操作："
echo "1) 启动日志监控"
echo "2) 检查应用状态"
echo "3) 重启应用"
echo "4) 查看应用信息"
echo "5) 启动Android Studio"
echo "6) 清除应用数据"

read -p "请选择操作 (1-6): " choice

case $choice in
    1)
        echo "🔍 启动日志监控..."
        echo "按Ctrl+C停止监控"
        adb logcat | grep -E "(MPCWallet|MPC_|Error|Exception|FATAL)"
        ;;
    2)
        echo "📱 检查应用状态..."
        echo "设备连接状态："
        adb devices
        echo ""
        echo "应用进程："
        adb shell ps | grep mpcwallet || echo "应用未运行"
        ;;
    3)
        echo "🔄 重启应用..."
        adb shell am force-stop com.mpcwallet.app
        sleep 2
        adb shell am start -n com.mpcwallet.app/.ui.MainActivity
        echo "应用已重启"
        ;;
    4)
        echo "ℹ️  应用信息..."
        adb shell dumpsys package com.mpcwallet.app | head -20
        ;;
    5)
        echo "🚀 启动Android Studio..."
        open -a "Android Studio" .
        ;;
    6)
        echo "🗑️  清除应用数据..."
        adb shell pm clear com.mpcwallet.app
        echo "应用数据已清除"
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac 