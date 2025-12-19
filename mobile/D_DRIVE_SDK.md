# D 盘 Android Studio 配置指南

## 🔍 当前情况

- ✅ **Android Studio**: 安装在 D 盘 (`/mnt/d/Program Files/Android/Android Studio`)
- ✅ **Android SDK**: 在 C 盘（默认位置 `/mnt/c/Users/ericl/AppData/Local/Android/Sdk`）

**这是正常情况**：即使 Android Studio 安装在 D 盘，SDK 默认仍会安装在 C 盘的用户目录。

## 📍 查找 SDK 位置

### 方法 1: 在 Android Studio 中查看

1. 打开 Android Studio（在 Windows 上）
2. 菜单：`File > Settings` (或 `Android Studio > Preferences` on Mac)
3. 导航到：`Appearance & Behavior > System Settings > Android SDK`
4. 查看 "Android SDK Location" - 这就是 SDK 的实际路径

### 方法 2: 使用查找脚本

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
./find-android-sdk.sh
```

### 方法 3: 手动查找

```bash
# 查找所有可能的 SDK 位置
find /mnt/d -name "adb.exe" 2>/dev/null
find /mnt/c -name "adb.exe" 2>/dev/null

# 查找 platform-tools 目录
find /mnt/d -type d -name "platform-tools" 2>/dev/null | grep -i android
find /mnt/c -type d -name "platform-tools" 2>/dev/null | grep -i android
```

## 🔧 配置 SDK 路径

### 如果 SDK 在 C 盘（当前配置）

当前配置已经正确指向 C 盘的 SDK：
```bash
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
```

只需重新加载配置：
```bash
source ~/.bashrc
```

### 如果 SDK 在 D 盘（需要更新配置）

如果您的 SDK 确实在 D 盘，需要更新配置：

#### 步骤 1: 找到 SDK 路径

在 Android Studio 中查看 SDK Location，或使用查找脚本。

假设 SDK 在：`D:\Android\Sdk`（在 WSL 中是 `/mnt/d/Android/Sdk`）

#### 步骤 2: 更新配置

编辑 `~/.bashrc`：
```bash
nano ~/.bashrc
```

找到 Android SDK 配置部分，更新路径：
```bash
# 如果 SDK 在 D 盘
export ANDROID_HOME=/mnt/d/Android/Sdk  # 替换为您的实际路径
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
alias adb='$ANDROID_HOME/platform-tools/adb.exe'
alias emulator='$ANDROID_HOME/emulator/emulator.exe'
```

#### 步骤 3: 应用配置

```bash
source ~/.bashrc
```

#### 步骤 4: 验证

```bash
echo $ANDROID_HOME
adb version
```

## 🎯 推荐方案

### 方案 1: 使用当前 C 盘 SDK（最简单）

如果 SDK 在 C 盘，当前配置已经正确，只需：

```bash
source ~/.bashrc
adb version  # 验证
```

### 方案 2: 使用 Expo Go（无需配置 SDK）

**最简单的方式**，无需配置 Android SDK：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
# 在手机上扫描 QR 码即可
```

### 方案 3: 将 SDK 移到 D 盘（可选）

如果您想将 SDK 也移到 D 盘：

1. **在 Android Studio 中**：
   - `File > Settings > Appearance & Behavior > System Settings > Android SDK`
   - 点击 "Edit" 按钮
   - 选择新的 SDK 位置（例如：`D:\Android\Sdk`）
   - Android Studio 会移动或复制 SDK

2. **更新 WSL 配置**：
   ```bash
   # 更新 ~/.bashrc 中的路径
   export ANDROID_HOME=/mnt/d/Android/Sdk
   source ~/.bashrc
   ```

## ✅ 快速检查

运行以下命令检查当前配置：

```bash
# 检查环境变量
echo $ANDROID_HOME

# 测试 adb
adb version

# 如果上面失败，尝试完整路径
$ANDROID_HOME/platform-tools/adb.exe version
```

## 💡 重要提示

1. **SDK 位置独立于 Android Studio**：
   - Android Studio 可以在 D 盘
   - SDK 可以在 C 盘（默认）或 D 盘（如果自定义）

2. **WSL 路径格式**：
   - Windows: `D:\Android\Sdk`
   - WSL: `/mnt/d/Android/Sdk`

3. **使用 .exe 扩展名**：
   - 在 WSL 中调用 Windows 可执行文件需要 `.exe`
   - 已创建别名方便使用

## 🚀 下一步

1. **确认 SDK 位置**：在 Android Studio 中查看
2. **更新配置**（如果需要）：编辑 `~/.bashrc`
3. **重新加载**：`source ~/.bashrc`
4. **验证**：`adb version`
5. **开始开发**：`npm start`

## 🆘 需要帮助？

如果仍有问题：
1. 在 Android Studio 中查看实际的 SDK Location
2. 告诉我 SDK 的实际路径
3. 我可以帮您更新配置



