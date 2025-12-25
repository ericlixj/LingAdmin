# iOS 设备测试指南

本指南说明如何构建 iOS 应用并安装到自己的 iPhone 上进行测试，**无需发布到 App Store**。

## 前置要求

### 必需
- ✅ Apple Developer 账号（$99/年）
- ✅ EAS 账号（免费）
- ✅ iPhone 设备（iOS 13+）
- ✅ 已登录 EAS：`eas login`

### 可选
- macOS 和 Xcode（用于本地构建，更快）

## 方法 1：Development Build（推荐用于开发测试）

### 特点
- ✅ 支持热重载和调试
- ✅ 可以连接到开发服务器
- ✅ 适合开发和调试

### 步骤

#### 1. 构建开发版本

```bash
cd mobile
eas build --platform ios --profile development
```

或使用 npm 脚本：
```bash
npm run ios:build:dev
```

#### 2. 等待构建完成

构建完成后，EAS 会提供：
- 下载链接（.ipa 文件）
- QR 码（用于扫描安装）

#### 3. 安装到设备

**方法 A：通过 EAS 提供的链接**

1. 在构建完成后，EAS 会显示一个下载链接
2. 在 iPhone 的 Safari 浏览器中打开该链接
3. 点击下载，系统会提示安装
4. 前往 **设置 > 通用 > VPN与设备管理**
5. 信任开发者证书
6. 返回主屏幕，点击应用图标启动

**方法 B：使用 Expo Go（如果支持）**

如果应用使用标准 Expo API，也可以使用 Expo Go：
```bash
npx expo start
```
然后在 iPhone 上安装 Expo Go，扫描二维码。

## 方法 2：Preview Build（推荐用于功能验证）

### 特点
- ✅ 接近生产环境的构建
- ✅ 适合功能测试和演示
- ✅ 不需要开发服务器

### 步骤

#### 1. 构建预览版本

```bash
cd mobile
eas build --platform ios --profile preview
```

或使用 npm 脚本：
```bash
npm run ios:build:preview
```

#### 2. 安装到设备

安装步骤与方法 1 相同：
1. 在 iPhone Safari 中打开下载链接
2. 下载并安装
3. 信任开发者证书
4. 启动应用

## 方法 3：Ad Hoc Distribution（多设备分发）

### 特点
- ✅ 可以分发给多个设备
- ✅ 不需要 App Store Connect
- ✅ 适合团队内部测试

### 步骤

#### 1. 更新 eas.json 配置

在 `preview` profile 中添加设备 UDID：

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release",
        "simulator": false
      }
    }
  }
}
```

#### 2. 获取设备 UDID

在 iPhone 上：
- **设置 > 通用 > 关于本机 > 标识符（UDID）**

或使用 iTunes/Finder：
- 连接 iPhone 到 Mac
- 在 Finder/iTunes 中查看设备信息

#### 3. 配置设备

```bash
eas device:create
```

按提示输入设备 UDID 和名称。

#### 4. 构建

```bash
eas build --platform ios --profile preview
```

构建会自动包含已注册的设备。

## 方法 4：本地构建（最快，需要 Mac）

### 特点
- ✅ 构建速度快
- ✅ 不需要等待云端构建
- ✅ 需要 macOS 和 Xcode

### 步骤

#### 1. 安装 Xcode

从 App Store 安装 Xcode（需要 macOS）。

#### 2. 本地构建

```bash
cd mobile
eas build --platform ios --profile development --local
```

#### 3. 安装到设备

构建完成后，Xcode 会自动打开，您可以：
1. 连接 iPhone 到 Mac
2. 在 Xcode 中选择设备
3. 点击运行按钮安装

## 常见问题

### Q1: 安装后提示"未受信任的企业级开发者"

**解决方案**：
1. 前往 **设置 > 通用 > VPN与设备管理**
2. 找到开发者应用
3. 点击"信任 [开发者名称]"
4. 确认信任

### Q2: 应用无法安装

**可能原因**：
- 设备 UDID 未注册（Ad Hoc 分发）
- 证书过期
- 设备系统版本不兼容

**解决方案**：
```bash
# 检查构建状态
eas build:list --platform ios

# 查看构建详情
eas build:view [BUILD_ID]

# 重新配置凭证
eas credentials
```

### Q3: 如何更新应用？

每次更新都需要重新构建：
```bash
eas build --platform ios --profile preview
```

然后重新安装新的 .ipa 文件。

### Q4: 构建需要多长时间？

- **云端构建**：10-20 分钟
- **本地构建**：5-10 分钟（取决于机器性能）

### Q5: 可以安装到多少台设备？

- **Development Build**：无限制（但需要注册设备 UDID）
- **Ad Hoc**：最多 100 台设备（Apple 限制）
- **Preview Build**：无限制（通过内部链接分发）

### Q6: 如何查看已安装的应用？

在 iPhone 上：
- 主屏幕查找应用图标
- 如果找不到，检查是否在"资源库"中

## 快速命令参考

```bash
# 构建开发版本
eas build --platform ios --profile development
# 或
npm run ios:build:dev

# 构建预览版本
eas build --platform ios --profile preview
# 或
npm run ios:build:preview

# 查看构建列表
eas build:list --platform ios

# 下载构建文件
eas build:download [BUILD_ID]

# 查看构建详情
eas build:view [BUILD_ID]

# 注册设备
eas device:create

# 查看已注册设备
eas device:list
```

## 推荐流程

### 第一次安装

1. **配置项目**（只需一次）
   ```bash
   eas build:configure
   ```

2. **构建预览版本**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **在 iPhone 上安装**
   - 在 Safari 中打开构建链接
   - 下载并安装
   - 信任开发者证书

4. **测试应用功能**

### 后续更新

1. **重新构建**
   ```bash
   eas build --platform ios --profile preview
   ```

2. **安装新版本**
   - 删除旧版本（长按图标 > 删除应用）
   - 安装新版本

## 注意事项

1. **证书有效期**：开发证书有效期为 1 年，到期后需要重新生成
2. **设备限制**：Ad Hoc 分发最多 100 台设备
3. **网络要求**：首次安装需要网络连接下载应用
4. **系统版本**：确保 iPhone iOS 版本满足应用最低要求

## 成本说明

- **EAS Build 免费计划**：每月 30 次构建（足够个人测试）
- **Apple Developer**：$99/年（必需）

## 下一步

1. ✅ 确保已登录 EAS：`eas login`
2. ✅ 运行 `eas build:configure` 配置项目（首次）
3. ✅ 运行 `eas build --platform ios --profile preview` 构建
4. ✅ 在 iPhone 上安装并测试

## 相关资源

- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [iOS 设备注册](https://docs.expo.dev/build/internal-distribution/)
- [EAS Dashboard](https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds)





