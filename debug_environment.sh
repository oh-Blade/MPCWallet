#!/bin/bash

echo "🔍 MPC钱包环境诊断工具"
echo "=========================="

# 检查Android SDK
echo "📱 检查Android SDK..."
if [ -d "$ANDROID_HOME" ]; then
    echo "✅ Android SDK路径: $ANDROID_HOME"
    ls -la "$ANDROID_HOME"
else
    echo "❌ Android SDK未找到"
fi

# 检查Java版本
echo -e "\n☕ 检查Java版本..."
java -version

# 检查Gradle权限和文件
echo -e "\n🔧 检查Gradle配置..."
echo "gradlew文件大小: $(wc -c < gradlew) bytes"
echo "settings.gradle内容:"
cat settings.gradle

# 检查模拟器状态
echo -e "\n📱 检查连接的设备..."
adb devices

# 尝试清理和重建
echo -e "\n🧹 尝试清理构建..."
rm -rf .gradle
rm -rf app/build
echo "清理完成"

# 提供修复建议
echo -e "\n💡 修复建议:"
echo "1. 确保Android Studio已安装并配置正确"
echo "2. 在Android Studio中打开项目"
echo "3. 让Android Studio自动配置Gradle wrapper"
echo "4. 使用Android Studio的运行按钮进行构建"

echo -e "\n🚀 项目功能概览:"
echo "✅ MPC多方计算密钥生成"
echo "✅ 阈值签名 (t-of-n)"
echo "✅ QR码设备通信"
echo "✅ 多链支持 (ETH/BTC/Polygon/BSC)"
echo "✅ 现代化Android UI (Jetpack Compose)"
echo "✅ 安全本地存储"
echo "✅ 生物识别认证"

echo -e "\n📖 使用建议:"
echo "1. 首先在Android Studio中运行"
echo "2. 配置真实的Infura API密钥"
echo "3. 准备多个设备进行MPC测试"
echo "4. 使用QR码在设备间交换数据" 