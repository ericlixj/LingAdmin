# WSL 环境下配置 Android SDK

## 🪟 环境说明

- **Windows**: Android Studio 已安装
- **WSL**: Linux 环境（Ubuntu/Debian）
- **目标**: 在 WSL 中使用 Windows 上的 Android SDK

## 🔍 查找 Windows Android SDK 路径

Android SDK 通常安装在以下位置：

```
C:\Users\<用户名>\AppData\Local\Android\Sdk
```

在 WSL 中对应的路径是：
```
/mnt/c/Users/<用户名>/AppData/Local/Android/Sdk
```

## 📝 配置步骤

### 步骤 1: 确认 Android SDK 路径

在 WSL 中运行：

```bash
# 查找 adb.exe
find /mnt/c -name "adb.exe" 2>/dev/null | head -1

# 或直接检查常见位置
ls -la /mnt/c/Users/*/AppData/Local/Android/Sdk/platform-tools 2>/dev/null
```

找到路径后，记下 SDK 的完整路径，例如：
```
/mnt/c/Users/YourUsername/AppData/Local/Android/Sdk
```

### 步骤 2: 配置环境变量

编辑 WSL 的 shell 配置文件：

```bash
# 对于 bash
nano ~/.bashrc

# 或对于 zsh
nano ~/.zshrc
```

添加以下内容（**替换为您的实际路径**）：

```bash
# Android SDK (Windows 路径在 WSL 中)
export ANDROID_HOME=/mnt/c/Users/YourUsername/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

**重要提示**：
- 将 `YourUsername` 替换为您的 Windows 用户名
- 路径使用 Linux 格式（`/mnt/c/...`）
- 不要使用 Windows 路径格式（`C:\...`）

### 步骤 3: 应用配置

```bash
# 重新加载配置
source ~/.bashrc
# 或
source ~/.zshrc

# 验证
echo $ANDROID_HOME
```

### 步骤 4: 测试 adb

```bash
# 测试 adb（注意：在 WSL 中需要使用 adb.exe）
$ANDROID_HOME/platform-tools/adb.exe version

# 或创建别名
alias adb='$ANDROID_HOME/platform-tools/adb.exe'
```

## ⚠️ 重要注意事项

### 1. 使用 .exe 扩展名

在 WSL 中调用 Windows 可执行文件需要 `.exe` 扩展名：

```bash
# ✅ 正确
$ANDROID_HOME/platform-tools/adb.exe

# ❌ 错误
$ANDROID_HOME/platform-tools/adb
```

### 2. 创建便捷别名

为了方便使用，可以创建别名：

```bash
# 添加到 ~/.bashrc 或 ~/.zshrc
alias adb='$ANDROID_HOME/platform-tools/adb.exe'
alias emulator='$ANDROID_HOME/emulator/emulator.exe'
```

### 3. 路径大小写

Windows 文件系统不区分大小写，但 WSL 区分。确保路径正确。

### 4. 权限问题

如果遇到权限问题：

```bash
# 确保有执行权限（虽然 Windows 文件可能没有）
# 通常 WSL 可以执行 .exe 文件，但如果有问题：
chmod +x $ANDROID_HOME/platform-tools/adb.exe
```

## 🚀 使用 Expo（推荐方案）

**好消息**：使用 Expo Go 可以避免大部分这些问题！

### 方案 A: 使用 Expo Go（最简单）

1. **在 Android 手机上安装 Expo Go**
2. **在 WSL 中启动 Expo**：
   ```bash
   cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
   npm start
   ```
3. **扫描 QR 码**：使用 Expo Go 应用扫描

**优势**：
- ✅ 无需配置 Android SDK
- ✅ 无需处理 WSL/Windows 路径问题
- ✅ 直接在真机上测试

### 方案 B: 使用 Windows 上的 Android 模拟器

如果必须使用模拟器：

1. **在 Windows 上启动 Android Studio**
2. **启动 Android 模拟器**（在 Windows 中）
3. **在 WSL 中连接**：
   ```bash
   # 确保 adb 可以连接到 Windows 上的模拟器
   adb.exe connect localhost:5555
   # 或使用 Windows IP
   adb.exe connect <Windows_IP>:5555
   ```

## 🔧 自动化配置脚本

创建一个配置脚本：

```bash
#!/bin/bash
# setup-wsl-android.sh

# 自动查找 Android SDK
SDK_PATHS=(
    "/mnt/c/Users/$USER/AppData/Local/Android/Sdk"
    "/mnt/c/Users/$USER/.android/sdk"
    "/mnt/c/Program Files/Android/Android Studio/sdk"
)

SDK_PATH=""
for path in "${SDK_PATHS[@]}"; do
    if [ -d "$path/platform-tools" ]; then
        SDK_PATH="$path"
        break
    fi
done

if [ -z "$SDK_PATH" ]; then
    echo "❌ 未找到 Android SDK"
    echo "请手动指定路径："
    read -p "Android SDK 路径: " SDK_PATH
fi

# 检测 shell
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

# 添加配置
cat >> "$SHELL_CONFIG" << EOF

# Android SDK (WSL -> Windows)
export ANDROID_HOME=$SDK_PATH
export PATH=\$PATH:\$ANDROID_HOME/platform-tools
export PATH=\$PATH:\$ANDROID_HOME/emulator
alias adb='\$ANDROID_HOME/platform-tools/adb.exe'
alias emulator='\$ANDROID_HOME/emulator/emulator.exe'
EOF

echo "✅ 配置已添加到 $SHELL_CONFIG"
echo "请运行: source $SHELL_CONFIG"
```

## 📋 验证清单

运行以下命令验证配置：

```bash
# 1. 检查环境变量
echo $ANDROID_HOME

# 2. 检查 adb
$ANDROID_HOME/platform-tools/adb.exe version

# 3. 检查连接的设备（需要在 Windows 上启动模拟器）
$ANDROID_HOME/platform-tools/adb.exe devices

# 4. 测试 Expo
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
```

## 🐛 常见问题

### 1. adb 无法连接设备

**问题**: `adb.exe devices` 显示空列表

**解决**:
- 确保在 Windows 上启动了 Android 模拟器
- 尝试重启 adb server：
  ```bash
  $ANDROID_HOME/platform-tools/adb.exe kill-server
  $ANDROID_HOME/platform-tools/adb.exe start-server
  ```

### 2. 权限被拒绝

**问题**: `Permission denied` 错误

**解决**:
```bash
# 尝试使用完整路径
/mnt/c/Users/YourUsername/AppData/Local/Android/Sdk/platform-tools/adb.exe version
```

### 3. 路径找不到

**问题**: `No such file or directory`

**解决**:
- 检查路径是否正确（注意用户名）
- 使用 `ls` 验证路径存在：
  ```bash
  ls -la /mnt/c/Users/YourUsername/AppData/Local/Android/Sdk
  ```

### 4. Expo 无法找到 Android SDK

**问题**: Expo 仍然报错找不到 SDK

**解决**:
- 确保环境变量已正确设置
- 重启终端或 WSL
- 使用 Expo Go 避免这个问题

## 💡 推荐工作流程

### 开发流程（推荐）

1. **在 WSL 中开发**：
   ```bash
   cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
   npm start
   ```

2. **在 Windows 上使用 Expo Go**：
   - 手机和 Windows 电脑在同一网络
   - 扫描 WSL 中 Expo 显示的 QR 码
   - 应用在手机上打开

3. **或使用 Windows 上的模拟器**：
   - 在 Windows 上启动 Android Studio
   - 启动模拟器
   - 在 WSL 中运行 `npm run android`

## 🎯 快速开始

### 最简单的方式（推荐）

```bash
# 1. 在 WSL 中启动 Expo
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start

# 2. 在手机上安装 Expo Go 并扫描 QR 码
# 完成！无需配置 Android SDK
```

### 如果需要模拟器

```bash
# 1. 配置 Android SDK 路径（见上面步骤）
# 2. 在 Windows 上启动 Android Studio 和模拟器
# 3. 在 WSL 中运行
npm run android
```

## 📚 相关文档

- [WSL 文档](https://docs.microsoft.com/en-us/windows/wsl/)
- [Android Studio 文档](https://developer.android.com/studio)
- [Expo 文档](https://docs.expo.dev/)


