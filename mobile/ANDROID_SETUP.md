# Android 开发环境设置指南

## 🔍 问题诊断

您遇到的错误：
```
Failed to resolve the Android SDK path. Default install location not found: /home/ericl/Android/sdk
```

这表明：
- ❌ Android SDK 未安装或未找到
- ❌ ANDROID_HOME 环境变量未配置

## 📦 解决方案

### 方法 1: 安装 Android Studio（推荐）

#### 步骤 1: 下载并安装 Android Studio

1. **下载 Android Studio**：
   - 访问 [Android Studio 官网](https://developer.android.com/studio)
   - 下载 Linux 版本
   - 或使用包管理器安装

2. **安装 Android Studio**：

**Ubuntu/Debian**:
```bash
# 下载
wget https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2023.3.1.18/android-studio-2023.3.1.18-linux.tar.gz

# 解压
tar -xzf android-studio-*.tar.gz

# 移动到合适的位置
sudo mv android-studio /opt/

# 创建启动脚本
sudo ln -s /opt/android-studio/bin/studio.sh /usr/local/bin/android-studio
```

**或使用 Snap**:
```bash
sudo snap install android-studio --classic
```

#### 步骤 2: 启动 Android Studio 并安装 SDK

1. **启动 Android Studio**：
   ```bash
   android-studio
   # 或
   /opt/android-studio/bin/studio.sh
   ```

2. **首次启动设置向导**：
   - 选择 "Standard" 安装
   - 等待下载和安装 Android SDK
   - 完成设置向导

3. **打开 SDK Manager**：
   - 菜单：`Tools > SDK Manager`
   - 或：`File > Settings > Appearance & Behavior > System Settings > Android SDK`

4. **安装必要的组件**：
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform (API 33 或更高)
   - ✅ Android Emulator
   - ✅ Google Play services

#### 步骤 3: 查找 Android SDK 路径

在 Android Studio 的 SDK Manager 中，您会看到 "Android SDK Location"，通常是：

- **Linux**: `~/Android/Sdk` 或 `/home/用户名/Android/Sdk`
- **macOS**: `~/Library/Android/sdk`
- **Windows**: `C:\Users\用户名\AppData\Local\Android\Sdk`

#### 步骤 4: 配置环境变量

**对于 Linux (bash)**:

编辑 `~/.bashrc`:
```bash
nano ~/.bashrc
# 或
vim ~/.bashrc
```

添加以下内容（替换为您的实际路径）：
```bash
# Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**对于 zsh**:

编辑 `~/.zshrc`:
```bash
nano ~/.zshrc
```

添加相同的内容。

**应用更改**:
```bash
# 重新加载配置
source ~/.bashrc
# 或
source ~/.zshrc

# 验证
echo $ANDROID_HOME
adb --version
```

### 方法 2: 仅安装命令行工具（不安装 Android Studio）

如果您不想安装完整的 Android Studio，可以只安装命令行工具：

```bash
# 创建目录
mkdir -p ~/Android/Sdk

# 下载命令行工具
cd ~/Android/Sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip

# 解压
unzip commandlinetools-linux-*.zip

# 创建目录结构
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

# 安装 SDK
./cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"

# 配置环境变量（同上）
```

## ✅ 验证安装

运行以下命令验证：

```bash
# 检查 ANDROID_HOME
echo $ANDROID_HOME

# 检查 adb
adb --version

# 检查连接的设备
adb devices

# 检查 SDK 路径
ls -la $ANDROID_HOME
```

应该看到类似输出：
```
Android Debug Bridge version 1.0.41
```

## 🚀 使用 Expo（无需 Android Studio）

**好消息**：如果您使用 Expo，可以**不需要**安装 Android Studio！

### Expo Go 方式（最简单）

1. **在 Android 手机上安装 Expo Go**：
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **启动 Expo 开发服务器**：
   ```bash
   cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
   npm start
   ```

3. **扫描 QR 码**：
   - 使用 Expo Go 应用扫描终端中的 QR 码
   - 应用会自动打开

**优势**：
- ✅ 无需安装 Android Studio
- ✅ 无需配置 ANDROID_HOME
- ✅ 无需创建模拟器
- ✅ 直接在真机上测试

### 使用 Android 模拟器（需要 Android Studio）

如果您想使用模拟器，才需要安装 Android Studio。

## 🔧 快速修复（临时方案）

如果您已经安装了 Android Studio 但路径不对，可以临时设置：

```bash
# 查找 Android SDK
find ~ -name "platform-tools" -type d 2>/dev/null | head -1

# 假设找到的路径是 ~/Android/Sdk/platform-tools
# 那么 SDK 路径是 ~/Android/Sdk

# 临时设置（仅当前终端会话）
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 验证
adb --version
```

**永久设置**：将上述 export 命令添加到 `~/.bashrc` 或 `~/.zshrc`。

## 📝 检查清单

- [ ] Android Studio 已安装
- [ ] Android SDK 已安装（通过 Android Studio）
- [ ] ANDROID_HOME 环境变量已配置
- [ ] PATH 包含 Android SDK 工具
- [ ] `adb --version` 命令可以运行
- [ ] 已重新加载 shell 配置（`source ~/.bashrc`）

## 🎯 推荐方案

**对于 Expo 项目，推荐使用 Expo Go**：

1. ✅ 无需安装 Android Studio
2. ✅ 无需配置环境变量
3. ✅ 直接在真机上测试
4. ✅ 更快的开发体验

**只有在以下情况才需要 Android Studio**：
- 需要测试原生功能
- 需要自定义原生代码
- 需要构建生产版本

## 💡 下一步

1. **如果使用 Expo Go**：
   ```bash
   npm start
   # 扫描 QR 码即可
   ```

2. **如果需要模拟器**：
   - 按照上面的步骤安装 Android Studio
   - 配置环境变量
   - 创建 Android 虚拟设备（AVD）
   - 然后运行 `npm run android`

## 🆘 需要帮助？

如果仍有问题：
1. 检查 Android Studio 是否正确安装
2. 确认 SDK 路径是否正确
3. 确保环境变量已正确配置并重新加载
4. 查看 [Expo 文档](https://docs.expo.dev/) 了解更多选项


