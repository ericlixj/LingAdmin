# iOS 测试指南

本指南说明如何在 iOS 设备上测试应用。提供了多种方法，从最简单到最完整。

## 前置要求

### 方法 1：Expo Go（最简单，推荐用于快速测试）

**要求：**
- ✅ iPhone（iOS 13+）
- ✅ Mac 和 iPhone 在同一 WiFi 网络
- ✅ 在 iPhone 上安装 Expo Go（App Store 免费下载）

**无需：**
- ❌ Xcode
- ❌ Apple Developer 账号
- ❌ 代码签名

### 方法 2：EAS 构建预览版本（推荐用于完整测试）

**要求：**
- ✅ Apple Developer 账号（$99/年）
- ✅ EAS 账号（免费注册）
- ✅ iPhone 设备

**无需：**
- ❌ Xcode
- ❌ 本地构建环境

### 方法 3：本地 Xcode 构建（最快，但需要 Xcode）

**要求：**
- ✅ Xcode（从 App Store 安装）
- ✅ Apple Developer 账号（$99/年）
- ✅ iPhone 或 iOS 模拟器

---

## 方法 1：使用 Expo Go（最简单）

这是最快开始测试的方法，适合功能验证和开发调试。

### 步骤

#### 1. 安装依赖（如果还没有）

```bash
cd mobile
npm install
```

#### 2. 在 iPhone 上安装 Expo Go

1. 打开 App Store
2. 搜索 "Expo Go"
3. 安装应用

#### 3. 启动开发服务器

```bash
# 使用脚本（推荐）
./start-ios.sh

# 或直接使用命令
npm start
# 然后按 'i' 键，或在 Expo Go 中扫描二维码
```

#### 4. 在 iPhone 上连接

1. 确保 iPhone 和 Mac 在同一 WiFi 网络
2. 在 iPhone 上打开 Expo Go 应用
3. 扫描终端中显示的二维码
4. 应用会自动加载

### 注意事项

- ⚠️ Expo Go 只支持标准的 Expo API，如果有自定义原生代码，需要使用方法 2 或 3
- ✅ 支持热重载，修改代码后会自动刷新
- ✅ 支持调试功能
- ✅ 适合开发阶段测试

---

## 方法 2：EAS 构建预览版本（推荐用于完整测试）

适合需要测试完整原生功能，或者需要分发给他人测试。

### 步骤

#### 1. 安装 EAS CLI

```bash
npm install -g eas-cli
```

#### 2. 登录 EAS

```bash
eas login
```

如果没有账号，访问 https://expo.dev/signup 注册（免费）。

#### 3. 配置项目（首次）

```bash
cd mobile
eas build:configure
```

选择 iOS 平台，EAS 会引导你完成配置。

#### 4. 配置 Apple Developer 凭证

EAS 会自动管理证书，但你需要：

1. 登录 Apple Developer 账号
2. 允许 EAS 访问你的账号（EAS 会引导）
3. 或者手动配置凭证：

```bash
eas credentials
```

#### 5. 构建预览版本

```bash
# 使用 npm 脚本
npm run ios:build:preview

# 或直接使用 EAS 命令
eas build --platform ios --profile preview
```

构建过程需要 10-20 分钟，可以在 https://expo.dev 查看进度。

#### 6. 安装到 iPhone

构建完成后：

1. EAS 会提供下载链接（QR 码或 URL）
2. 在 iPhone 的 **Safari 浏览器**中打开链接
3. 点击下载并安装
4. 前往 **设置 > 通用 > VPN与设备管理**（或 **设备管理**）
5. 找到你的开发者证书，点击"信任 [开发者名称]"
6. 返回主屏幕，点击应用图标启动

### 更新应用

每次需要更新时，重新运行构建命令：

```bash
npm run ios:build:preview
```

然后重新安装新的 .ipa 文件。

---

## 方法 3：本地 Xcode 构建（最快，需要 Xcode）

如果你已经安装了 Xcode，这是最快的构建方式。

### 步骤

#### 1. 安装 Xcode

从 App Store 安装 Xcode（约 12GB，需要一些时间）。

#### 2. 安装 CocoaPods（如果还没有）

```bash
sudo gem install cocoapods
```

#### 3. 预构建 iOS 项目

```bash
cd mobile
npx expo prebuild --platform ios
```

这会创建 `ios/` 目录。

#### 4. 安装 iOS 依赖

```bash
cd ios
pod install
cd ..
```

#### 5. 打开 Xcode 项目

```bash
open ios/*.xcworkspace
```

#### 6. 配置签名

在 Xcode 中：
1. 选择项目
2. 选择 Target
3. 在 "Signing & Capabilities" 中：
   - 选择你的 Team（需要 Apple Developer 账号）
   - Xcode 会自动管理证书

#### 7. 选择设备并运行

1. 连接 iPhone 到 Mac，或在 Xcode 中选择模拟器
2. 点击运行按钮（▶️）
3. 应用会构建并安装到设备上

### 使用 Expo CLI 运行（更简单）

如果你只是想在模拟器或连接的设备上快速运行：

```bash
cd mobile
npm run ios
```

这会自动处理大部分步骤。

---

## 推荐流程

### 第一次测试

1. **先尝试 Expo Go**（方法 1）
   - 最快，无需配置
   - 验证基本功能

2. **如果需要完整测试原生功能**
   - 使用 EAS 构建预览版本（方法 2）
   - 或安装 Xcode 使用本地构建（方法 3）

### 日常开发

- **开发调试**：使用 Expo Go（方法 1）或本地 Xcode（方法 3）
- **功能测试**：使用 EAS 构建预览版本（方法 2）

### 发布前测试

- **必须使用**：EAS 构建生产版本或本地 Xcode 构建
- **不能使用**：Expo Go（不支持生产构建）

---

## 常见问题

### Q1: Expo Go 无法连接

**解决方案：**
1. 确保 Mac 和 iPhone 在同一 WiFi 网络
2. 检查防火墙设置，确保端口 8081 开放
3. 尝试使用 Tunnel 模式：
   ```bash
   npx expo start --tunnel
   ```

### Q2: EAS 构建失败

**可能原因：**
- 凭证配置错误
- Apple Developer 账号问题

**解决方案：**
```bash
# 查看构建日志
eas build:view [BUILD_ID]

# 重新配置凭证
eas credentials
```

### Q3: 安装后提示"未受信任的开发者"

**解决方案：**
1. 前往 **设置 > 通用 > VPN与设备管理**（或 **设备管理**）
2. 找到开发者应用
3. 点击"信任 [开发者名称]"
4. 确认信任

### Q4: 无法在真机上运行（Xcode）

**可能原因：**
- 设备未注册
- 签名配置错误

**解决方案：**
1. 在 Xcode 中，Window > Devices and Simulators
2. 连接设备，确保设备已注册
3. 检查 Signing & Capabilities 中的 Team 设置

### Q5: 构建很慢

- **EAS 云端构建**：通常 10-20 分钟（取决于队列）
- **本地 Xcode 构建**：通常 5-10 分钟（取决于机器性能）
- **Expo Go**：最快，即时加载（但需要开发服务器运行）

---

## 快速命令参考

```bash
# ===== Expo Go =====
npm start                    # 启动开发服务器
./start-ios.sh              # 使用启动脚本

# ===== EAS 构建 =====
eas login                    # 登录 EAS
eas build:configure          # 配置项目（首次）
npm run ios:build:preview    # 构建预览版本
npm run ios:build:dev        # 构建开发版本
eas build:list --platform ios # 查看构建列表

# ===== 本地构建 =====
npm run ios                  # 使用 Expo CLI 运行（自动处理）
npx expo prebuild --platform ios  # 预构建 iOS 项目
```

---

## 成本说明

- **Expo Go**：完全免费
- **EAS Build 免费计划**：每月 30 次构建（足够个人测试）
- **Apple Developer**：$99/年（必需用于真机测试和生产发布）
- **Xcode**：免费（但需要 macOS）

---

## 下一步

1. ✅ 选择适合你的方法（推荐先试 Expo Go）
2. ✅ 按照对应方法的步骤操作
3. ✅ 在 iPhone 上测试应用功能
4. ✅ 根据需要选择其他方法进行更深入的测试

如有问题，参考详细的文档：
- [IOS_QUICK_START.md](./IOS_QUICK_START.md) - 快速开始
- [IOS_DEVICE_TESTING.md](./IOS_DEVICE_TESTING.md) - 设备测试详细指南
- [IOS_RELEASE_GUIDE.md](./IOS_RELEASE_GUIDE.md) - 发布到 App Store



