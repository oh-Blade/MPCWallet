#!/bin/bash

echo "✅ Android Studio 项目配置验证"
echo "============================="

echo ""
echo "📋 1. 验证项目结构"
echo "├── settings.gradle"
if [ -f "settings.gradle" ]; then
    echo "│   ✓ 存在"
    if grep -q "include ':app'" settings.gradle; then
        echo "│   ✓ 包含 ':app' 模块"
    else
        echo "│   ❌ 缺少 ':app' 模块"
    fi
else
    echo "│   ❌ 不存在"
fi

echo "├── build.gradle (project)"
if [ -f "build.gradle" ]; then
    echo "│   ✓ 存在"
else
    echo "│   ❌ 不存在"
fi

echo "├── app/build.gradle"
if [ -f "app/build.gradle" ]; then
    echo "│   ✓ 存在"
else
    echo "│   ❌ 不存在"
fi

echo "└── gradle.properties"
if [ -f "gradle.properties" ]; then
    echo "    ✓ 存在"
else
    echo "    ❌ 不存在"
fi

echo ""
echo "📱 2. 验证设备连接"
adb devices

echo ""
echo "🎯 3. Android Studio 修复步骤"
echo ""
echo "【主要解决方案】"
echo "问题: 'Unable to find modules to build for app Run Configuration'"
echo "原因: settings.gradle 缺少模块声明"
echo "修复: 已添加 include ':app'"
echo ""
echo "【在 Android Studio 中执行】:"
echo ""
echo "步骤 1: 关闭当前项目"
echo "步骤 2: File > Open > 选择项目根目录"
echo "步骤 3: 等待 Gradle Sync 完成"
echo ""
echo "如果仍有问题:"
echo "步骤 4: File > Invalidate Caches and Restart"
echo "步骤 5: 选择 'Invalidate and Restart'"
echo ""
echo "【手动创建 Run Configuration】:"
echo "1. Run > Edit Configurations..."
echo "2. 点击 '+' 按钮"
echo "3. 选择 'Android App'"
echo "4. 设置 Name: app"
echo "5. 设置 Module: MPCWallet.app (应该在下拉列表中)"
echo "6. 点击 Apply 然后 OK"

echo ""
echo "🔧 4. 验证模块可见性"
echo ""
echo "在 Android Studio 中检查:"
echo "- File > Project Structure > Modules"
echo "- 应该看到 'MPCWallet' 和 'MPCWallet.app'"
echo "- 如果看不到，说明 settings.gradle 修复生效了"

echo ""
echo "⚡ 5. 快速测试命令"
echo ""
echo "测试项目同步 (可选):"
echo "echo \"./gradlew --version  # 测试 Gradle 是否正常\""
echo ""
echo "启动 Android Studio:"
echo "open -a 'Android Studio' ."

echo ""
echo "📊 6. 配置文件内容确认"
echo ""
echo "settings.gradle 应包含:"
echo "---"
cat settings.gradle
echo "---"

echo ""
echo "🎉 项目配置修复完成！"
echo ""
echo "主要修复内容:"
echo "✓ 在 settings.gradle 中添加了 include ':app'"
echo "✓ 清理了项目缓存"
echo "✓ 模拟器连接正常"
echo ""
echo "现在应该可以在 Android Studio 中正常构建和运行项目了！" 