# Android SDK 快速修复

## ✅ SDK 路径确认

您的 Android SDK 路径：
- **Windows**: `C:\Users\ericl\AppData\Local\Android\Sdk`
- **WSL**: `/mnt/c/Users/ericl/AppData/Local/Android/Sdk`

**配置已正确！** ✅

## 🚀 解决方案

### 方案 1: 使用启动脚本（推荐）

已创建 `start-expo.sh` 脚本，自动加载环境变量：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 启动 Expo（自动加载环境变量）
./start-expo.sh

# 或启动 Android
./start-expo.sh --android
```

### 方案 2: 手动设置环境变量

在启动 Expo 前，确保环境变量已设置：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 加载环境变量
source ~/.bashrc

# 确保 ANDROID_HOME 已设置
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 验证
echo $ANDROID_HOME
adb version

# 启动 Expo
npm start
```

### 方案 3: 使用 Expo Go（最简单，推荐）

**无需配置 Android SDK**，直接使用：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
```

然后在手机上：
1. 安装 [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. 扫描终端中的 QR 码
3. 应用自动打开

## 🔧 如果使用 Android 模拟器

### 步骤 1: 在 Windows 上启动模拟器

1. 打开 Android Studio（在 Windows 上）
2. 启动 Android 模拟器

### 步骤 2: 在 WSL 中连接

```bash
# 确保环境变量已加载
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 检查设备连接
adb devices

# 如果看不到设备，重启 adb
adb kill-server
adb start-server
adb devices
```

### 步骤 3: 启动 Expo

```bash
# 使用启动脚本
./start-expo.sh --android

# 或手动启动
npm run android
```

## ✅ 验证配置

运行以下命令验证：

```bash
# 1. 检查环境变量
source ~/.bashrc
echo $ANDROID_HOME
# 应该显示: /mnt/c/Users/ericl/AppData/Local/Android/Sdk

# 2. 测试 adb
adb version
# 应该显示版本信息

# 3. 检查 SDK 文件
ls -la $ANDROID_HOME/platform-tools/adb.exe
# 应该显示文件信息
```

## 💡 重要提示

1. **每次新终端**：需要运行 `source ~/.bashrc` 加载环境变量
2. **使用启动脚本**：`./start-expo.sh` 会自动加载环境变量
3. **推荐 Expo Go**：最简单，无需配置 Android SDK

## 🎯 推荐工作流程

### 开发（最简单）

```bash
# 1. 启动 Expo
npm start

# 2. 在手机上扫描 QR 码
# 完成！无需配置 Android SDK
```

### 使用模拟器

```bash
# 1. 在 Windows 上启动 Android Studio 和模拟器
# 2. 在 WSL 中运行
./start-expo.sh --android
```

## 🐛 如果仍有问题

### 问题：Expo 仍然找不到 SDK

**解决**：
```bash
# 确保在启动 Expo 前设置环境变量
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 验证
echo $ANDROID_HOME
adb version

# 然后启动
npm start
```

### 问题：adb 无法连接设备

**解决**：
```bash
# 重启 adb server
adb kill-server
adb start-server
adb devices
```

## 📝 当前配置总结

- ✅ SDK 路径：`/mnt/c/Users/ericl/AppData/Local/Android/Sdk`
- ✅ 已添加到 `~/.bashrc`
- ✅ 已创建启动脚本 `start-expo.sh`
- ✅ `package.json` 中的 android 脚本已更新

## 🚀 立即开始

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 更新依赖（如果还没更新）
npm install

# 启动 Expo
npm start
# 或使用启动脚本
./start-expo.sh
```

然后在手机上扫描 QR 码即可！



