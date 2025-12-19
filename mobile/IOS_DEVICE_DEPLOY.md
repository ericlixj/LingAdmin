# iOS 真机部署指南

本指南详细说明如何将应用构建并部署到连接到 Mac 的 iPhone 真机上。

## 前置要求

### 必需
- ✅ macOS 系统
- ✅ Xcode（从 App Store 安装，约 12GB）
- ✅ iPhone（iOS 13+）
- ✅ USB 数据线（连接 iPhone 到 Mac）
- ✅ Apple Developer 账号（免费账号也可用于个人设备测试，付费账号 $99/年用于发布）

### 可选但推荐
- CocoaPods（通常随 Xcode 自动安装）

---

## 快速开始

### 方法 1：使用自动脚本（推荐）

```bash
cd mobile
./build-ios-device.sh
```

脚本会自动：
1. 检查环境
2. 安装项目依赖
3. 预构建 iOS 项目
4. 安装 CocoaPods 依赖
5. 打开 Xcode 项目

然后按照脚本提示在 Xcode 中配置并运行。

### 方法 2：手动步骤

#### 步骤 1：安装项目依赖

```bash
cd mobile
npm install
```

#### 步骤 2：预构建 iOS 原生项目

```bash
npx expo prebuild --platform ios
```

这会创建 `ios/` 目录，包含完整的 Xcode 项目。

#### 步骤 3：安装 CocoaPods 依赖

```bash
cd ios
pod install
cd ..
```

**注意**：如果遇到权限错误（如 `.netrc` 权限问题），运行：
```bash
chmod 600 ~/.netrc
```

#### 步骤 4：连接 iPhone 到 Mac

1. 使用 USB 数据线连接 iPhone 到 Mac
2. 在 iPhone 上，如果出现"要信任此电脑吗？"提示，点击"信任"
3. 输入 iPhone 密码确认

#### 步骤 5：在 Xcode 中配置

1. **打开 Xcode 项目**：
   ```bash
   open ios/*.xcworkspace
   ```
   ⚠️ **重要**：必须打开 `.xcworkspace` 文件，不要打开 `.xcodeproj` 文件

2. **选择设备**：
   - 在 Xcode 顶部工具栏，点击设备选择器（显示 "Any iOS Device" 或模拟器名称的地方）
   - 选择你连接的 iPhone

3. **配置代码签名**：
   - 在左侧项目导航器中，点击项目名称（最顶部的蓝色图标）
   - 选择 **Target** > **Signing & Capabilities**
   - 勾选 **"Automatically manage signing"**
   - 在 **Team** 下拉菜单中选择你的 Apple Developer 账号
     - 如果没有账号，点击 "Add Account..." 登录
     - 免费 Apple ID 也可以用于个人设备测试
   - **Bundle Identifier** 会自动生成（如 `com.lingadmin.mobile`）
     - 如果提示已存在，在后面添加唯一后缀（如 `.dev`）

4. **配置证书**（如果需要）：
   - Xcode 会自动创建和下载必要的证书
   - 如果遇到错误，点击 "Download Manual Profiles"

#### 步骤 6：构建并运行

1. 点击 Xcode 左上角的运行按钮（▶️）
   - 或按快捷键 `Cmd + R`

2. **首次安装时的信任步骤**：
   - 应用安装到 iPhone 后可能无法立即打开
   - 在 iPhone 上：**设置 > 通用 > VPN与设备管理**（或 **设备管理**）
   - 找到你的开发者证书（显示为你的 Apple ID 邮箱）
   - 点击进入，然后点击 **"信任 [你的邮箱]"**
   - 确认信任
   - 返回主屏幕，点击应用图标启动

---

## 详细配置说明

### Apple Developer 账号类型

#### 免费 Apple ID（个人开发）

**优点：**
- ✅ 完全免费
- ✅ 可以安装到自己的设备上测试
- ✅ 证书有效期 7 天，过期后需要重新构建

**限制：**
- ❌ 不能发布到 App Store
- ❌ 证书需要定期重新生成
- ❌ 最多安装到 3 台设备

**适用场景：** 个人开发测试

#### 付费 Apple Developer（$99/年）

**优点：**
- ✅ 证书有效期 1 年
- ✅ 可以发布到 App Store
- ✅ 可以创建 Ad Hoc 和 Enterprise 分发
- ✅ 可以安装到更多设备

**适用场景：** 团队开发、App Store 发布

### Bundle Identifier

Bundle Identifier 是应用的唯一标识符，格式通常是：`com.company.appname`

在 `app.config.js` 中配置：
```javascript
ios: {
  bundleIdentifier: 'com.lingadmin.mobile',
}
```

如果使用免费账号，可能需要修改为更唯一的标识符，如：`com.yourname.lingadmin.mobile`

### 代码签名

Xcode 的自动签名功能会自动：
1. 创建开发证书
2. 注册设备
3. 创建配置文件
4. 配置应用权限

通常不需要手动管理，除非遇到特殊问题。

---

## 常见问题

### Q1: "Could not launch app" 或应用安装后无法打开

**原因**：未信任开发者证书

**解决方案**：
1. 在 iPhone 上：**设置 > 通用 > VPN与设备管理**（或 **设备管理**）
2. 找到开发者证书
3. 点击进入，然后点击 **"信任"**
4. 确认信任
5. 返回主屏幕，重新打开应用

### Q2: "No signing certificate found"

**原因**：未选择 Team 或账号未登录

**解决方案**：
1. 在 Xcode 中：项目 > Target > Signing & Capabilities
2. 点击 Team 下拉菜单
3. 如果没有账号，点击 "Add Account..." 登录你的 Apple ID
4. 选择正确的 Team

### Q3: "Bundle identifier is already in use"

**原因**：Bundle Identifier 已被其他应用使用

**解决方案**：
在 `app.config.js` 中修改 Bundle Identifier 为更唯一的名称：
```javascript
ios: {
  bundleIdentifier: 'com.yourname.lingadmin.mobile', // 添加你的名字或其他唯一标识
}
```

然后重新运行 `npx expo prebuild --platform ios`。

### Q4: CocoaPods 安装失败

**可能原因：**
- 网络问题
- 权限问题（`.netrc` 文件权限）

**解决方案**：
```bash
# 修复 .netrc 权限
chmod 600 ~/.netrc

# 清理 CocoaPods 缓存
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
```

### Q5: "Device not found" 或 iPhone 未显示在设备列表中

**解决方案**：
1. 确保 USB 数据线连接正常
2. 在 iPhone 上信任此电脑
3. 在 Xcode 中：**Window > Devices and Simulators**
4. 检查 iPhone 是否显示在列表中
5. 如果显示但显示为不可用，可能需要解锁 iPhone 或重新连接

### Q6: Xcode 版本不兼容

**解决方案**：
1. 更新 Xcode 到最新版本（App Store > 更新）
2. 检查 Expo SDK 版本与 Xcode 版本的兼容性
3. 参考 Expo 文档：https://docs.expo.dev/workflow/ios-simulator/

### Q7: 构建速度很慢

**原因**：首次构建需要编译所有依赖

**解决方案**：
- 首次构建通常需要 5-15 分钟，这是正常的
- 后续增量构建会快很多（1-3 分钟）
- 确保 Mac 有足够的磁盘空间（至少 10GB 可用）

### Q8: 应用在 iPhone 上崩溃

**调试步骤**：
1. 在 Xcode 中查看控制台输出（底部面板）
2. 查看崩溃日志：**Window > Devices and Simulators > View Device Logs**
3. 启用调试模式：在 Xcode 中按 `Cmd + Shift + K` 清理，然后重新构建

---

## 更新应用

当代码更新后，需要重新构建并安装：

### 方法 1：在 Xcode 中直接运行

1. 在 Xcode 中点击运行按钮（▶️）
2. Xcode 会自动重新构建并安装到 iPhone

### 方法 2：使用 Expo CLI

```bash
cd mobile
npm run ios
```

这会自动构建并安装到连接的设备或模拟器。

---

## 生产构建（发布版本）

如果要构建发布版本（用于测试或发布到 App Store）：

### 1. 在 Xcode 中构建 Archive

1. 在 Xcode 中选择 **Product > Scheme > Edit Scheme...**
2. 选择 **Run**，在 **Build Configuration** 中选择 **Release**
3. 选择 **Product > Archive**
4. 等待归档完成，**Organizer** 窗口会自动打开
5. 可以选择：
   - **Distribute App**：发布到 App Store 或创建 Ad Hoc 分发
   - **Validate App**：验证应用
   - **Export**：导出 IPA 文件

### 2. 使用 EAS Build（推荐，云端构建）

```bash
# 构建生产版本
npm run ios:build

# 构建预览版本（用于测试）
npm run ios:build:preview
```

参考 [IOS_RELEASE_GUIDE.md](./IOS_RELEASE_GUIDE.md) 获取详细说明。

---

## 工作流程建议

### 日常开发

1. **使用 Expo Go**（最快，适合快速迭代）
   ```bash
   npm start
   # 在 iPhone 的 Expo Go 中扫描二维码
   ```

2. **使用本地 Xcode 构建**（测试原生功能）
   ```bash
   npm run ios
   # 或使用脚本
   ./build-ios-device.sh
   ```

### 发布前测试

1. **构建 Release 版本**
   - 在 Xcode 中：Product > Archive
   - 或使用：`npm run ios:build:preview`

2. **在真机上完整测试所有功能**

3. **提交审核**（如果发布到 App Store）
   ```bash
   npm run ios:submit
   ```

---

## 相关文档

- [IOS_TEST_GUIDE.md](./IOS_TEST_GUIDE.md) - iOS 测试方法总览
- [IOS_QUICK_START.md](./IOS_QUICK_START.md) - 快速开始指南
- [IOS_RELEASE_GUIDE.md](./IOS_RELEASE_GUIDE.md) - 发布到 App Store 指南
- [EXPO_SETUP.md](./EXPO_SETUP.md) - Expo 设置说明

---

## 快速命令参考

```bash
# 完整设置（首次）
cd mobile
npm install
npx expo prebuild --platform ios
cd ios && pod install && cd ..
open ios/*.xcworkspace

# 或使用脚本
./build-ios-device.sh

# 快速运行（已设置后）
npm run ios

# 重新构建（代码更新后）
cd ios
pod install
cd ..
npm run ios
```

---

## 需要帮助？

如果遇到问题：
1. 检查本文档的"常见问题"部分
2. 查看 Xcode 控制台的错误信息
3. 参考 Expo 官方文档：https://docs.expo.dev/
4. 查看项目中的其他 iOS 相关文档

