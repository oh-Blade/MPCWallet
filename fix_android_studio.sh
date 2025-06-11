#!/bin/bash

echo "🔧 修复 Android Studio 模块配置问题"
echo "=================================="

echo ""
echo "✅ 步骤1: 已修复 settings.gradle"
echo "   添加了 include ':app' 声明"

echo ""
echo "🛠️  步骤2: 清理项目缓存"
echo "删除 .gradle 和 build 目录..."

# 清理缓存目录
if [ -d ".gradle" ]; then
    rm -rf .gradle
    echo "✓ 已删除 .gradle 目录"
fi

if [ -d "build" ]; then
    rm -rf build
    echo "✓ 已删除项目级 build 目录"
fi

if [ -d "app/build" ]; then
    rm -rf app/build
    echo "✓ 已删除 app/build 目录"
fi

echo ""
echo "🔄 步骤3: 重新生成 Gradle Wrapper"
if [ -f "gradlew" ]; then
    ./gradlew wrapper --gradle-version=8.1.1
    echo "✓ Gradle Wrapper 已更新"
fi

echo ""
echo "📱 步骤4: 验证模拟器连接"
echo "当前连接的设备："
adb devices

echo ""
echo "🎯 步骤5: Android Studio 修复指南"
echo ""
echo "现在请在 Android Studio 中执行以下操作："
echo ""
echo "1. 关闭 Android Studio"
echo "2. 重新打开项目: open -a 'Android Studio' ."
echo "3. 等待 'Gradle sync' 完成"
echo "4. 如果仍有问题，执行："
echo "   - File > Invalidate Caches and Restart"
echo "   - 选择 'Invalidate and Restart'"
echo ""
echo "5. 检查 Run Configuration:"
echo "   - 点击 Run/Debug 配置下拉菜单"
echo "   - 选择 'Edit Configurations...'"
echo "   - 确认 'app' 模块已选中"
echo "   - Module 字段应显示 'MPCWallet.app'"

echo ""
echo "🚀 步骤6: 重新启动 Android Studio"
# 重新启动 Android Studio
open -a "Android Studio" .

echo ""
echo "✅ 修复完成！"
echo ""
echo "📋 如果问题仍然存在，请尝试："
echo "1. 手动同步: File > Sync Project with Gradle Files"
echo "2. 重新导入: File > New > Import Project"
echo "3. 检查 Android SDK 路径: File > Project Structure > SDK Location"

echo ""
echo "🔍 常见解决方案："
echo ""
echo "【方案A: 重新创建 Run Configuration】"
echo "1. Run > Edit Configurations"
echo "2. 点击 '+' > Android App"
echo "3. Name: app"
echo "4. Module: MPCWallet.app"
echo "5. Apply > OK"
echo ""
echo "【方案B: 检查模块导入】"
echo "1. File > Project Structure"
echo "2. Modules 选项卡"
echo "3. 确认 'app' 模块存在"
echo "4. 如果不存在，点击 '+' 添加"
echo ""
echo "【方案C: 强制重新同步】"
echo "1. ./gradlew clean"
echo "2. File > Invalidate Caches and Restart"
echo "3. File > Sync Project with Gradle Files" 