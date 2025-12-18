# Android 启动完整指南

## ✅ 环境检查结果

根据检查，您的环境配置**完全正确**：

- ✅ ANDROID_HOME: `/mnt/c/Users/ericl/AppData/Local/Android/Sdk`
- ✅ adb 正常工作
- ✅ 模拟器已连接: `emulator-5554`
- ✅ Expo 已安装: `0.17.13`

## 🚀 启动方法

### 方法 1: 使用专用 Android 启动脚本（推荐）

已创建 `start-android.sh` 脚本，会自动：
- 加载环境变量
- 检查设备连接
- 启动 Expo Android

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
./start-android.sh
```

### 方法 2: 使用 npm 脚本

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 确保环境变量已加载
source ~/.bashrc

# 运行
npm run android
```

### 方法 3: 手动启动

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 1. 加载环境变量
source ~/.bashrc

# 2. 确保 ANDROID_HOME 已设置
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 3. 检查设备
adb devices

# 4. 启动 Expo
npx expo start --android
```

### 方法 4: 使用 Expo Go（最简单，推荐）

**无需配置 Android SDK**，直接在真机上测试：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
```

然后在手机上：
1. 安装 [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. 扫描终端中的 QR 码
3. 应用自动打开

## 🔍 如果仍然无法启动

### 检查 1: 环境变量

```bash
source ~/.bashrc
echo $ANDROID_HOME
# 应该显示: /mnt/c/Users/ericl/AppData/Local/Android/Sdk
```

### 检查 2: adb 连接

```bash
adb devices
# 应该显示: emulator-5554    device
```

### 检查 3: Expo 版本

```bash
npx expo --version
# 应该显示版本号
```

### 检查 4: 运行诊断脚本

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
./test-android-env.sh
```

## 🐛 常见错误及解决

### 错误 1: "Failed to resolve the Android SDK path"

**原因**: Expo 启动时无法读取 ANDROID_HOME

**解决**:
```bash
# 确保在启动前设置环境变量
source ~/.bashrc
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 使用启动脚本（自动处理）
./start-android.sh
```

### 错误 2: "No devices/emulators found"

**原因**: 模拟器未启动或未连接

**解决**:
1. 在 Windows 上启动 Android Studio
2. 启动 Android 模拟器
3. 在 WSL 中检查：
   ```bash
   adb devices
   ```

### 错误 3: Expo 命令找不到

**解决**: 使用 `npx expo` 而不是 `expo`

```bash
npx expo start --android
```

## 📋 完整启动流程

### 使用模拟器

```bash
# 1. 在 Windows 上
#    - 打开 Android Studio
#    - 启动 Android 模拟器

# 2. 在 WSL 中
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 3. 启动应用
./start-android.sh
# 或
npm run android
```

### 使用 Expo Go（推荐）

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
npm start
# 扫描 QR 码即可
```

## 💡 推荐方案

**对于开发，强烈推荐使用 Expo Go**：

1. ✅ 无需配置 Android SDK
2. ✅ 无需启动模拟器
3. ✅ 真机测试更真实
4. ✅ 开发更快速
5. ✅ 热重载和快速刷新

**只有在以下情况才需要模拟器**：
- 测试原生功能
- 测试特定 Android 版本
- 构建生产版本

## 🎯 立即开始

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 最简单的方式
npm start
# 然后扫描 QR 码

# 或使用模拟器
./start-android.sh
```

## 📚 相关文档

- [DEBUG_ANDROID.md](./DEBUG_ANDROID.md) - 详细调试指南
- [EXPO_FIX.md](./EXPO_FIX.md) - Expo 问题修复
- [WSL_ANDROID_SETUP.md](./WSL_ANDROID_SETUP.md) - WSL 配置指南

