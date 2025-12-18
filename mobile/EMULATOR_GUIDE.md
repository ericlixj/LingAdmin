# 模拟器启动指南

## 📱 Android 模拟器

### 方式 1: 通过 Android Studio 启动（推荐）

#### 步骤 1: 打开 Android Studio

```bash
# 如果已安装，直接打开
android-studio

# 或从应用程序启动
```

#### 步骤 2: 打开 AVD Manager

1. 在 Android Studio 中，点击右上角的 **设备管理器** 图标（手机图标）
2. 或通过菜单：`Tools > Device Manager`
3. 或通过菜单：`Tools > AVD Manager`

#### 步骤 3: 创建虚拟设备（如果还没有）

1. 点击 **Create Device** 或 **+ Create Virtual Device**
2. 选择设备类型（推荐：**Pixel 5** 或 **Pixel 6**）
3. 点击 **Next**
4. 选择系统镜像（推荐：**API 33 (Android 13)** 或更高）
   - 如果没有下载，点击 **Download** 下载
5. 点击 **Next**
6. 配置设备（可以保持默认）
7. 点击 **Finish**

#### 步骤 4: 启动模拟器

1. 在 AVD Manager 中，找到您创建的虚拟设备
2. 点击设备右侧的 **▶️ Play** 按钮
3. 等待模拟器启动（首次启动可能需要几分钟）

### 方式 2: 通过命令行启动

#### 列出所有可用的模拟器

```bash
emulator -list-avds
```

输出示例：
```
Pixel_5_API_33
Pixel_6_API_34
```

#### 启动指定的模拟器

```bash
emulator -avd Pixel_5_API_33
```

#### 启动并指定参数

```bash
# 启动并指定分辨率
emulator -avd Pixel_5_API_33 -scale 0.75

# 启动并启用 GPU 加速
emulator -avd Pixel_5_API_33 -gpu host

# 启动并指定内存大小
emulator -avd Pixel_5_API_33 -memory 2048
```

### 方式 3: 通过 React Native 自动启动

当您运行 `npm run android` 时，如果没有运行的设备，React Native 会自动启动一个模拟器。

### 检查模拟器是否运行

```bash
adb devices
```

输出示例：
```
List of devices attached
emulator-5554   device
```

如果看到 `emulator-5554 device`，说明模拟器已成功启动。

### Android 模拟器常用命令

```bash
# 查看所有连接的设备（包括模拟器和真机）
adb devices

# 查看模拟器日志
adb logcat

# 重启模拟器
adb reboot

# 关闭模拟器
adb emu kill

# 截图
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# 安装 APK
adb install app.apk

# 卸载应用
adb uninstall com.lingadmin
```

### Android 模拟器常见问题

#### 1. 模拟器启动很慢

**解决**：
- 启用硬件加速（HAXM 或 Hypervisor）
- 减少分配给模拟器的内存
- 使用 x86/x86_64 系统镜像（而不是 ARM）

#### 2. 模拟器黑屏

**解决**：
```bash
# 关闭所有模拟器
adb emu kill

# 清理并重启
emulator -avd <AVD_NAME> -wipe-data
```

#### 3. 无法连接到 localhost

**问题**：Android 模拟器无法访问 `localhost:4000`

**解决**：使用 `10.0.2.2` 代替 `localhost`

在 `.env` 文件中：
```env
API_BASE_URL=http://10.0.2.2:4000
```

**说明**：
- `10.0.2.2` 是 Android 模拟器访问宿主机 localhost 的特殊 IP
- 这是 Android 模拟器的网络配置特性

## 🍎 iOS 模拟器（仅 macOS）

### 方式 1: 通过 Xcode 启动

#### 步骤 1: 打开 Xcode

```bash
open -a Xcode
```

#### 步骤 2: 打开模拟器

1. 在 Xcode 菜单栏：`Xcode > Open Developer Tool > Simulator`
2. 或使用快捷键：`Cmd + Shift + ,`（在 Xcode 中）

#### 步骤 3: 选择设备

1. 在模拟器菜单栏：`File > Open Simulator`
2. 选择设备（如：iPhone 14 Pro、iPhone 15 等）

### 方式 2: 通过命令行启动

#### 列出所有可用的模拟器

```bash
xcrun simctl list devices
```

输出示例：
```
== Device Types ==
iPhone 14 Pro (com.apple.CoreSimulator.SimDeviceType.iPhone-14-Pro)
iPhone 15 (com.apple.CoreSimulator.SimDeviceType.iPhone-15)
...

== Runtimes ==
iOS 17.0 (17.0 - ...)
...

== Devices ==
-- iOS 17.0 --
    iPhone 14 Pro (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)
    iPhone 15 (B2C3D4E5-F6A7-8901-BCDE-F12345678901) (Shutdown)
```

#### 启动指定的模拟器

```bash
# 启动 iPhone 14 Pro（使用设备 ID）
xcrun simctl boot A1B2C3D4-E5F6-7890-ABCD-EF1234567890

# 或使用设备名称（需要指定运行时）
xcrun simctl boot "iPhone 14 Pro"

# 打开模拟器应用
open -a Simulator
```

#### 启动并指定参数

```bash
# 启动并指定设备类型和运行时
xcrun simctl boot "iPhone 14 Pro" --runtime "iOS-17-0"

# 启动并擦除数据
xcrun simctl boot "iPhone 14 Pro" --erase
```

### 方式 3: 通过 React Native 自动启动

当您运行 `npm run ios` 时，如果没有运行的模拟器，React Native 会自动启动一个。

### 检查模拟器是否运行

```bash
xcrun simctl list devices | grep Booted
```

输出示例：
```
    iPhone 14 Pro (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)
```

### iOS 模拟器常用命令

```bash
# 列出所有设备
xcrun simctl list devices

# 启动设备
xcrun simctl boot "iPhone 14 Pro"

# 关闭设备
xcrun simctl shutdown "iPhone 14 Pro"

# 关闭所有设备
xcrun simctl shutdown all

# 擦除设备数据
xcrun simctl erase "iPhone 14 Pro"

# 安装应用
xcrun simctl install booted /path/to/app.app

# 卸载应用
xcrun simctl uninstall booted com.lingadmin

# 截图
xcrun simctl io booted screenshot screenshot.png

# 录制视频
xcrun simctl io booted recordVideo video.mov
# 按 Ctrl+C 停止录制

# 打开模拟器应用
open -a Simulator

# 重启模拟器
xcrun simctl reboot "iPhone 14 Pro"
```

### iOS 模拟器常见问题

#### 1. 模拟器无法启动

**解决**：
```bash
# 关闭所有模拟器
xcrun simctl shutdown all

# 重启 CoreSimulatorService
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService

# 清理模拟器数据
xcrun simctl erase all
```

#### 2. 模拟器很慢

**解决**：
- 使用较新的设备型号（如 iPhone 14 Pro 而不是 iPhone 8）
- 减少分配给模拟器的内存
- 关闭不必要的应用

#### 3. 无法连接到 localhost

**问题**：iOS 模拟器可以访问 `localhost`，但有时需要配置

**解决**：在 `.env` 文件中：
```env
API_BASE_URL=http://localhost:4000
```

如果仍有问题，尝试使用 `127.0.0.1`：
```env
API_BASE_URL=http://127.0.0.1:4000
```

## 🚀 快速启动流程

### Android 完整流程

```bash
# 1. 启动模拟器（如果还没启动）
emulator -avd Pixel_5_API_33

# 或通过 Android Studio 启动

# 2. 等待模拟器完全启动（看到主屏幕）

# 3. 检查设备连接
adb devices

# 4. 配置环境变量（.env 文件）
API_BASE_URL=http://10.0.2.2:4000

# 5. 启动 Metro Bundler
npm start

# 6. 在另一个终端启动应用
npm run android
```

### iOS 完整流程

```bash
# 1. 启动模拟器（如果还没启动）
xcrun simctl boot "iPhone 14 Pro"
open -a Simulator

# 或通过 Xcode 启动

# 2. 等待模拟器完全启动（看到主屏幕）

# 3. 检查设备
xcrun simctl list devices | grep Booted

# 4. 配置环境变量（.env 文件）
API_BASE_URL=http://localhost:4000

# 5. 启动 Metro Bundler
npm start

# 6. 在另一个终端启动应用
npm run ios
```

## 💡 推荐配置

### Android 推荐配置

- **设备型号**: Pixel 5 或 Pixel 6
- **系统版本**: Android 13 (API 33) 或更高
- **内存**: 2GB 或 4GB
- **分辨率**: 1080 x 2340 (推荐)

### iOS 推荐配置

- **设备型号**: iPhone 14 Pro 或 iPhone 15
- **系统版本**: iOS 17.0 或更高
- **内存**: 自动分配（通常足够）

## 🔧 性能优化

### Android 模拟器优化

1. **启用硬件加速**：
   - 在 AVD Manager 中，编辑设备
   - 在 Graphics 中选择 "Hardware - GLES 2.0"

2. **使用 x86 镜像**：
   - 选择 x86_64 系统镜像（而不是 ARM）

3. **调整内存**：
   - 不要分配过多内存（2-4GB 足够）

### iOS 模拟器优化

1. **使用较新的设备型号**：
   - 新设备通常性能更好

2. **关闭不必要的功能**：
   - 关闭动画、减少视觉效果

## 📝 环境变量配置总结

根据您使用的模拟器，配置 `.env` 文件：

```env
# Android 模拟器
API_BASE_URL=http://10.0.2.2:4000

# iOS 模拟器
API_BASE_URL=http://localhost:4000

# 真机（Android 或 iOS）
API_BASE_URL=http://192.168.1.100:4000  # 替换为您的电脑 IP
```

## 🎯 下一步

模拟器启动后：

1. ✅ 确保后端服务运行（`capp/backend` 在端口 4000）
2. ✅ 配置 `.env` 文件
3. ✅ 启动 Metro Bundler：`npm start`
4. ✅ 运行应用：`npm run android` 或 `npm run ios`

## 📚 更多资源

- [Android 模拟器官方文档](https://developer.android.com/studio/run/emulator)
- [iOS 模拟器官方文档](https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device)
- [React Native 设备文档](https://reactnative.dev/docs/running-on-device)

