# Expo 项目 iOS 真机部署快速指南

本指南专门针对 Expo 项目，说明如何部署到连接到 Xcode 的 iPhone 真机。

## 前置检查

- ✅ macOS 系统
- ✅ Xcode 已安装（App Store）
- ✅ iPhone 已连接到 Mac（USB）
- ✅ Apple Developer 账号（免费 Apple ID 也可用于个人设备测试）

## 快速步骤

### 1. 安装项目依赖

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile
npm install
```

### 2. 预构建 iOS 原生项目

这会生成 `ios/` 目录，包含完整的 Xcode 项目：

```bash
npx expo prebuild --platform ios
```

### 3. 安装 CocoaPods 依赖

```bash
cd ios
pod install
cd ..
```

**如果遇到权限错误**（如 `.netrc` 权限问题）：
```bash
chmod 600 ~/.netrc
pod install
```

### 4. 打开 Xcode 项目

⚠️ **重要**：必须打开 `.xcworkspace` 文件，不要打开 `.xcodeproj`

```bash
open ios/*.xcworkspace
```

### 5. 在 Xcode 中配置

1. **选择设备**
   - 在 Xcode 顶部工具栏，点击设备选择器
   - 选择你连接的 iPhone

2. **配置代码签名**
   - 左侧项目导航器，点击项目名称（蓝色图标）
   - 选择 **Target** > **Signing & Capabilities**
   - ✅ 勾选 **"Automatically manage signing"**
   - 在 **Team** 下拉菜单中选择你的 Apple ID
     - 如果没有，点击 "Add Account..." 登录
     - 免费 Apple ID 也可以用于个人设备测试
   - Bundle Identifier 会自动生成（如 `com.lingadmin.mobile`）
     - 如果有冲突，在后面添加 `.dev` 等后缀

### 6. 构建并运行

- 点击运行按钮（▶️）或按 `Cmd + R`
- Xcode 会自动构建并安装到 iPhone

### 7. 首次安装：信任开发者证书

应用安装后，在 iPhone 上：

1. **设置 > 通用 > VPN与设备管理**（或 **设备管理**）
2. 找到你的开发者证书（显示为你的 Apple ID 邮箱）
3. 点击进入，然后点击 **"信任 [你的邮箱]"**
4. 确认信任
5. 返回主屏幕，点击应用图标启动

## 使用自动脚本（推荐）

如果安装了依赖，可以直接运行：

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile
./build-ios-device.sh
```

脚本会自动执行步骤 1-4，然后打开 Xcode。

## 使用 Expo CLI 运行（更简单）

Expo 也提供了简化的命令：

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile
npm run ios
```

这会自动：
- 预构建 iOS 项目（如果不存在）
- 安装 CocoaPods 依赖
- 在连接的设备或模拟器上运行

**首次使用**可能需要在 Xcode 中手动配置签名。

## 后续更新

代码更新后，有两种方式：

### 方式 1：在 Xcode 中直接运行
- 点击运行按钮（▶️）
- Xcode 会自动重新构建并安装

### 方式 2：使用 Expo CLI
```bash
npm run ios
```

## 常见问题

### Q: "No signing certificate found"
在 Xcode 中配置 Signing & Capabilities，选择你的 Team。

### Q: "Bundle identifier is already in use"
在 `app.config.js` 中修改：
```javascript
ios: {
  bundleIdentifier: 'com.yourname.lingadmin.mobile',
}
```
然后重新运行 `npx expo prebuild --platform ios`。

### Q: CocoaPods 安装失败
```bash
chmod 600 ~/.netrc
cd ios
rm -rf Pods Podfile.lock
pod install
```

### Q: iPhone 未显示在设备列表中
1. 确保 USB 连接正常
2. 在 iPhone 上信任此电脑
3. 解锁 iPhone
4. 在 Xcode 中：Window > Devices and Simulators 检查

## 详细文档

- [IOS_DEVICE_DEPLOY.md](./IOS_DEVICE_DEPLOY.md) - 完整部署指南
- [IOS_TEST_GUIDE.md](./IOS_TEST_GUIDE.md) - iOS 测试方法总览

