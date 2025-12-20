# Expo Android SDK 问题修复指南

## 🔧 已修复的问题

### 1. 包版本更新

已更新 `package.json`：
- ✅ `react-native`: `0.73.0` → `0.73.6`
- ✅ `@types/react`: `^18.2.42` → `~18.2.45`

**下一步**：运行 `npm install` 更新依赖

### 2. Android SDK 路径问题

Expo 在 WSL 中可能无法自动读取 `ANDROID_HOME` 环境变量。

## 🚀 解决方案

### 方案 1: 使用启动脚本（推荐）

已创建启动脚本 `start-expo.sh`，会自动加载环境变量：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 使用启动脚本
./start-expo.sh

# 或指定参数
./start-expo.sh --android
```

### 方案 2: 手动设置环境变量后启动

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 加载环境变量
source ~/.bashrc

# 确保 ANDROID_HOME 已设置
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 启动 Expo
npm start
```

### 方案 3: 使用 Expo Go（最简单，推荐）

**无需配置 Android SDK**，直接使用 Expo Go：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 启动 Expo（不需要 Android SDK）
npm start

# 在手机上安装 Expo Go 并扫描 QR 码
# 完成！无需配置 Android SDK
```

## 📝 完整步骤

### 1. 更新依赖

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm install
```

### 2. 启动 Expo

**选项 A: 使用启动脚本**
```bash
./start-expo.sh
```

**选项 B: 使用 npm（推荐使用 Expo Go）**
```bash
npm start
# 然后扫描 QR 码
```

**选项 C: 如果需要 Android 模拟器**
```bash
# 确保环境变量已加载
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk

# 在 Windows 上启动 Android Studio 和模拟器
# 然后在 WSL 中运行
npm run android
```

## ✅ 验证

### 检查环境变量

```bash
source ~/.bashrc
echo $ANDROID_HOME
# 应该显示: /mnt/c/Users/ericl/AppData/Local/Android/Sdk
```

### 检查 adb

```bash
adb version
# 或
$ANDROID_HOME/platform-tools/adb.exe version
```

## 🎯 推荐工作流程

### 开发（最简单）

1. **启动 Expo**：
   ```bash
   npm start
   ```

2. **在手机上扫描 QR 码**：
   - 安装 [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - 扫描终端中的 QR 码
   - 应用自动打开

**优势**：
- ✅ 无需配置 Android SDK
- ✅ 无需处理 WSL/Windows 路径问题
- ✅ 真机测试更真实
- ✅ 开发更快速

### 使用模拟器（如果需要）

1. **在 Windows 上启动 Android Studio**
2. **启动 Android 模拟器**
3. **在 WSL 中**：
   ```bash
   source ~/.bashrc
   ./start-expo.sh --android
   ```

## 🐛 如果仍有问题

### 问题 1: 仍然找不到 Android SDK

**解决**：
```bash
# 确保环境变量在启动 Expo 前已设置
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
npm start
```

### 问题 2: 包版本警告

**解决**：
```bash
npm install
# 这会安装正确版本的包
```

### 问题 3: Metro Bundler 启动失败

**解决**：
```bash
# 清除缓存
npm start -- --clear
# 或
expo start -c
```

## 💡 最佳实践

1. **开发时使用 Expo Go**：最简单，无需配置
2. **测试原生功能时使用模拟器**：需要配置 Android SDK
3. **使用启动脚本**：确保环境变量正确加载

## 📚 相关文档

- [EXPO_QUICK_START.md](./EXPO_QUICK_START.md)
- [WSL_ANDROID_SETUP.md](./WSL_ANDROID_SETUP.md)
- [Expo 官方文档](https://docs.expo.dev/)





