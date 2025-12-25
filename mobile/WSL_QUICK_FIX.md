# WSL Android SDK 快速配置

## 🔍 查找 Android SDK

Android Studio 可能安装在 D 盘，但 SDK 通常在以下位置：

### 常见位置

1. **C 盘（默认）**: `/mnt/c/Users/ericl/AppData/Local/Android/Sdk`
2. **D 盘（如果自定义）**: 
   - `/mnt/d/Users/ericl/AppData/Local/Android/Sdk`
   - `/mnt/d/Android/Sdk`
   - 或其他自定义路径

### 快速查找

运行查找脚本：
```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
./find-android-sdk.sh
```

或手动查找：
```bash
# 查找 adb.exe
find /mnt/d -name "adb.exe" 2>/dev/null
find /mnt/c -name "adb.exe" 2>/dev/null
```

## 🔧 配置步骤

### 方法 1: 使用配置脚本（推荐）

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
./setup-wsl-android.sh
```

### 方法 2: 手动配置

如果 SDK 在 D 盘，需要更新配置：

```bash
# 编辑配置文件
nano ~/.bashrc

# 找到 Android SDK 配置部分，更新路径，例如：
# export ANDROID_HOME=/mnt/d/Android/Sdk  # 替换为您的实际路径

# 重新加载
source ~/.bashrc
```

### 方法 3: 临时设置（当前终端）

```bash
# 如果 SDK 在 C 盘
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk

# 如果 SDK 在 D 盘（替换为您的实际路径）
# export ANDROID_HOME=/mnt/d/Android/Sdk

export PATH=$PATH:$ANDROID_HOME/platform-tools
alias adb='$ANDROID_HOME/platform-tools/adb.exe'
```

## ✅ 验证配置

```bash
# 检查环境变量
echo $ANDROID_HOME

# 测试 adb（注意使用 .exe）
$ANDROID_HOME/platform-tools/adb.exe version

# 或使用别名
adb version
```

## 🚀 使用 Expo（推荐）

**最简单的方式**：使用 Expo Go，无需配置 SDK！

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
# 然后在手机上扫描 QR 码
```

## 📱 如果需要使用模拟器

1. **在 Windows 上启动 Android Studio**
2. **启动 Android 模拟器**（在 Windows 中）
3. **在 WSL 中连接**：

```bash
# 确保 adb 可以连接到 Windows 上的模拟器
adb devices

# 如果看不到设备，尝试：
adb kill-server
adb start-server
adb devices
```

4. **运行 Expo**：
```bash
npm run android
```

## ⚠️ 重要提示

1. **使用 .exe 扩展名**：在 WSL 中调用 Windows 可执行文件需要 `.exe`
2. **路径格式**：使用 Linux 路径格式 `/mnt/c/...`，不是 Windows 格式
3. **重启终端**：配置后需要重新打开终端或运行 `source ~/.bashrc`

## 🎯 推荐工作流程

### 开发（最简单）

```bash
# 1. 在 WSL 中启动 Expo
npm start

# 2. 在手机上安装 Expo Go 并扫描 QR 码
# 完成！无需配置 Android SDK
```

### 使用模拟器

```bash
# 1. 在 Windows 上启动 Android Studio 和模拟器
# 2. 在 WSL 中配置环境变量（已完成）
# 3. 运行
npm run android
```







