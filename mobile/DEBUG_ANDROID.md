# Android 启动问题调试指南

## 🔍 问题诊断步骤

### 1. 检查环境变量

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 加载环境变量
source ~/.bashrc

# 检查 ANDROID_HOME
echo $ANDROID_HOME
# 应该显示: /mnt/c/Users/ericl/AppData/Local/Android/Sdk

# 检查 adb
adb version
# 或
$ANDROID_HOME/platform-tools/adb.exe version
```

### 2. 检查 Expo 安装

```bash
# 检查 Expo 是否安装
npx expo --version

# 检查本地安装
ls node_modules/.bin/expo
```

### 3. 检查 Android 设备/模拟器

```bash
# 检查连接的设备
adb devices

# 如果没有设备，确保：
# 1. 在 Windows 上启动了 Android Studio
# 2. 启动了 Android 模拟器
# 3. 或连接了真机并启用了 USB 调试
```

### 4. 测试启动

```bash
# 方法 1: 使用启动脚本
./start-expo.sh

# 方法 2: 手动设置环境变量
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
npx expo start

# 方法 3: 使用 npm 脚本
npm start
```

## 🐛 常见问题

### 问题 1: "Failed to resolve the Android SDK path"

**原因**: Expo 无法读取 ANDROID_HOME 环境变量

**解决**:
```bash
# 确保在启动前设置环境变量
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 验证
echo $ANDROID_HOME
adb version

# 然后启动
npx expo start --android
```

### 问题 2: "spawn adb ENOENT"

**原因**: adb 不在 PATH 中或路径不正确

**解决**:
```bash
# 确保 adb.exe 存在
ls -la /mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe

# 添加到 PATH
export PATH=$PATH:/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools

# 测试
adb version
```

### 问题 3: "No devices/emulators found"

**原因**: 没有运行的 Android 设备或模拟器

**解决**:
1. **使用 Expo Go（推荐）**：
   ```bash
   npm start
   # 扫描 QR 码，无需模拟器
   ```

2. **启动模拟器**：
   - 在 Windows 上打开 Android Studio
   - 启动 Android 模拟器
   - 在 WSL 中检查：
     ```bash
     adb devices
     ```

### 问题 4: Expo 命令找不到

**原因**: 使用 `expo` 而不是 `npx expo`

**解决**:
```bash
# 使用 npx（推荐）
npx expo start

# 或使用 npm 脚本
npm start
```

## ✅ 完整启动流程

### 使用 Expo Go（最简单）

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 启动 Expo
npm start

# 在手机上：
# 1. 安装 Expo Go
# 2. 扫描 QR 码
# 完成！
```

### 使用 Android 模拟器

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 1. 在 Windows 上启动 Android Studio 和模拟器

# 2. 在 WSL 中设置环境变量
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 3. 检查设备
adb devices

# 4. 启动 Expo
npx expo start --android
# 或使用启动脚本
./start-expo.sh --android
```

## 🔧 调试命令

```bash
# 检查所有相关配置
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

echo "=== 环境变量 ==="
source ~/.bashrc
echo "ANDROID_HOME: $ANDROID_HOME"
echo "PATH: $PATH" | grep -o '[^:]*android[^:]*'

echo "=== SDK 文件 ==="
ls -la $ANDROID_HOME/platform-tools/adb.exe 2>/dev/null || echo "adb.exe not found"

echo "=== Expo 版本 ==="
npx expo --version

echo "=== 连接的设备 ==="
adb devices 2>/dev/null || echo "adb not working"
```

## 💡 推荐方案

**最简单的方式**：使用 Expo Go

```bash
npm start
# 扫描 QR 码即可，无需配置 Android SDK
```

## 🆘 如果仍有问题

请提供以下信息：
1. 运行 `npm start` 或 `npx expo start --android` 的完整错误输出
2. 运行 `adb devices` 的输出
3. 运行 `echo $ANDROID_HOME` 的输出







