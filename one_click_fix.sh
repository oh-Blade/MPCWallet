#!/bin/bash

echo "🚀 一键修复 Android Studio 配置问题"
echo "================================="

echo ""
echo "正在执行完整修复流程..."

echo ""
echo "🔄 1. 强制清理所有缓存"
echo "删除 Android Studio 缓存..."

# 强制清理所有缓存
if [ -d ".idea" ]; then
    rm -rf .idea
    echo "✓ 删除 .idea 目录"
fi

if [ -d ".gradle" ]; then
    rm -rf .gradle
    echo "✓ 删除 .gradle 目录"
fi

if [ -d "build" ]; then
    rm -rf build
    echo "✓ 删除 build 目录"
fi

if [ -d "app/build" ]; then
    rm -rf app/build
    echo "✓ 删除 app/build 目录"
fi

echo ""
echo "✅ 2. 验证关键配置文件"

# 确保 settings.gradle 正确
if ! grep -q "include ':app'" settings.gradle; then
    echo "include ':app'" >> settings.gradle
    echo "✓ 修复 settings.gradle"
else
    echo "✓ settings.gradle 已正确"
fi

echo ""
echo "📱 3. 检查设备连接"
adb devices

echo ""
echo "🎯 4. 重新启动 Android Studio"
echo "正在启动 Android Studio..."

# 确保 Android Studio 完全关闭
pkill -f "Android Studio" 2>/dev/null || true
sleep 2

# 重新启动
open -a "Android Studio" .

echo ""
echo "⏳ 5. 等待启动完成 (15秒)"
echo "请等待 Android Studio 完全启动..."
sleep 15

echo ""
echo "📋 6. 手动操作指引"
echo "=================="
echo ""
echo "Android Studio 启动后，请按照以下步骤操作："
echo ""
echo "第1步: 等待项目加载"
echo "   - 等待底部进度条完成"
echo "   - 确保没有错误提示"
echo ""
echo "第2步: 强制同步项目"
echo "   - File > Sync Project with Gradle Files"
echo "   - 等待同步完成"
echo ""
echo "第3步: 创建Run Configuration"
echo "   - 点击顶部工具栏的配置下拉菜单"
echo "   - 选择 'Edit Configurations...'"
echo "   - 点击 '+' > 'Android App'"
echo "   - 设置 Name: app"
echo "   - 设置 Module: MPCWallet.app"
echo "   - 点击 Apply > OK"
echo ""
echo "第4步: 测试运行"
echo "   - 确保设备选择: emulator-5554"
echo "   - 点击绿色运行按钮 ▶️"

echo ""
echo "🔧 7. 故障排除"
echo "============="
echo ""
echo "如果Module下拉列表为空:"
echo "   - File > Invalidate Caches and Restart"
echo "   - 选择 'Invalidate and Restart'"
echo ""
echo "如果仍有问题:"
echo "   - File > Project Structure > Modules"
echo "   - 确认看到 MPCWallet.app 模块"
echo "   - 如果没有，点击 '+' > Import Gradle Project > 选择app目录"

echo ""
echo "✅ 一键修复完成！"
echo ""
echo "🎯 关键提示："
echo "1. 确保选择 Module: MPCWallet.app (不是 MPCWallet)"
echo "2. 如果Module列表为空，先执行 Gradle 同步"
echo "3. 必要时使用 Invalidate Caches and Restart"
echo ""
echo "📱 设备状态："
adb devices

echo ""
echo "🎉 现在应该可以正常运行和调试MPC钱包应用了！" 