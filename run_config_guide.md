# 🔧 Android Studio Run Configuration 配置指南

## ❌ 问题症状
- 错误信息: "Error: Module not specified"
- Run按钮不可用或显示错误
- 无法选择运行目标

## ✅ 解决方案

### **步骤1: 打开Run Configuration设置**

1. 点击顶部工具栏中的配置下拉菜单（通常显示"app"或"Add Configuration..."）
2. 选择 **"Edit Configurations..."**
3. 或者通过菜单: **Run > Edit Configurations...**

### **步骤2: 删除错误的配置**

如果存在错误的配置：
1. 在左侧列表中选择现有的"app"配置
2. 点击上方的 **"-"** 按钮删除
3. 确认删除

### **步骤3: 创建新的Android App配置**

1. 点击左上角的 **"+"** 按钮
2. 在弹出的模板列表中选择 **"Android App"**
3. 会创建一个新的配置项

### **步骤4: 配置参数**

在右侧配置面板中设置：

| 字段 | 值 | 说明 |
|------|----|----|
| **Name** | `app` | 配置名称 |
| **Module** | `MPCWallet.app` | 从下拉列表选择 |
| **Package** | `com.mpcwallet.app` | 应用包名 |
| **Activity** | `com.mpcwallet.app.ui.MainActivity` | 启动Activity |

⚠️ **重要**: Module字段必须选择 `MPCWallet.app`，不是 `MPCWallet`

### **步骤5: 保存配置**

1. 点击 **"Apply"** 按钮
2. 点击 **"OK"** 按钮
3. 配置将保存并关闭对话框

## 🔄 如果Module列表为空

### **方法A: 强制项目同步**

1. **File > Sync Project with Gradle Files**
2. 等待同步完成（底部进度条）
3. 重新创建Run Configuration

### **方法B: 清除缓存并重启**

1. **File > Invalidate Caches and Restart**
2. 在弹出对话框中选择 **"Invalidate and Restart"**
3. 等待Android Studio重启
4. 重新创建Run Configuration

### **方法C: 手动导入模块**

1. **File > Project Structure**
2. 左侧选择 **"Modules"**
3. 点击 **"+"** > **"Import Gradle Project"**
4. 选择项目中的 `app` 目录
5. 点击 **"OK"** 导入

## 📋 验证配置正确性

### **检查模块结构**

在 **File > Project Structure > Modules** 中应该看到：
- `MPCWallet` (根项目)
- `MPCWallet.app` (应用模块)

### **检查配置显示**

配置成功后，工具栏应显示：
- 配置名称: `app`
- 运行按钮: 绿色三角形 ▶️
- 调试按钮: 绿色虫子图标 🐞

## 🎯 常见配置错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Module not specified | 未选择模块 | 在Module字段选择MPCWallet.app |
| Module列表为空 | 项目未同步 | 执行Gradle同步 |
| 找不到MainActivity | Activity路径错误 | 检查Activity完整路径 |
| 设备未连接 | 模拟器/设备问题 | 重启模拟器或连接设备 |

## ⚡ 快速解决命令

如果问题持续存在：

```bash
# 1. 清理项目缓存
rm -rf .idea/
rm -rf .gradle/

# 2. 重启Android Studio
open -a "Android Studio" .

# 3. 重新同步项目
# 在Android Studio中: File > Sync Project with Gradle Files
```

## 🎉 配置成功标志

✅ **成功配置后您应该能够：**
- 在工具栏看到"app"配置
- 点击运行按钮启动应用
- 选择目标设备 (emulator-5554)
- 应用正常安装到模拟器

---

💡 **提示**: 如果仍有问题，请确保 `settings.gradle` 包含 `include ':app'` 并且项目已完全同步。 