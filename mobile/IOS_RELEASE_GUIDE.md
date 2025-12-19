# iOS 发布指南

本指南将帮助您使用 EAS Build 构建和发布 iOS 应用到 App Store。

## 前置要求

### 1. Apple Developer 账号
- 需要有效的 [Apple Developer Program](https://developer.apple.com/programs/) 会员资格（年费 $99）
- 如果没有账号，请先注册：https://developer.apple.com/programs/enroll/

### 2. EAS CLI 和账号
- 确保已安装 EAS CLI：`npm install -g eas-cli`
- 登录 EAS 账号：`eas login`
- 如果没有账号，请先注册：https://expo.dev/

### 3. 项目配置检查
- ✅ `app.config.js` 已配置 `bundleIdentifier: 'com.lingadmin.mobile'`
- ✅ `eas.json` 已配置构建和提交配置
- ✅ `owner: 'ericlixj'` 已设置

## 步骤 1：配置 Apple Developer 凭证

EAS 可以自动管理您的 Apple Developer 凭证，或者您也可以手动配置。

### 自动管理（推荐）

首次构建时，EAS 会引导您设置凭证：

```bash
cd mobile
eas build:configure
```

选择 iOS 平台，EAS 会：
1. 自动创建 App ID（如果不存在）
2. 生成并管理证书和配置文件
3. 将凭证安全存储在 EAS 服务器上

### 手动配置（可选）

如果您想手动管理凭证：

1. **创建 App ID**
   - 访问 [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
   - 创建新的 App ID：`com.lingadmin.mobile`

2. **创建证书**
   - 在 Apple Developer Portal 中创建 Distribution Certificate

3. **创建 Provisioning Profile**
   - 创建 App Store Distribution Profile

## 步骤 2：更新 EAS 配置（如需要）

检查 `eas.json` 配置，确保 iOS 构建配置正确：

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildConfiguration": "Release"
      },
      "env": {
        "API_BASE_URL": "https://c-api.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    }
  }
}
```

## 步骤 3：构建 iOS 应用

### 构建生产版本

```bash
cd mobile
eas build --platform ios --profile production
```

### 构建预览版本（用于 TestFlight）

```bash
eas build --platform ios --profile preview
```

### 构建开发版本

```bash
eas build --platform ios --profile development
```

### 构建选项

- `--local`：在本地构建（需要 macOS 和 Xcode）
- `--non-interactive`：非交互模式（适合 CI/CD）
- `--clear-cache`：清除构建缓存

## 步骤 4：等待构建完成

构建过程通常需要 10-20 分钟。您可以在以下位置查看进度：

1. **终端输出**：实时显示构建日志
2. **EAS Dashboard**：https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

构建完成后，您会收到：
- 下载链接（.ipa 文件）
- 构建 ID
- 构建详情

## 步骤 5：提交到 App Store

### 方法 1：使用 EAS Submit（推荐）

EAS Submit 可以自动将应用提交到 App Store：

```bash
eas submit --platform ios --profile production
```

首次提交时，EAS 会要求：
1. **App Store Connect API Key**（推荐）
   - 在 [App Store Connect](https://appstoreconnect.apple.com/) 创建 API Key
   - 下载 `.p8` 文件
   - 提供 Key ID 和 Issuer ID

2. **或使用 App Store Connect 凭据**
   - Apple ID 和密码
   - 如果启用了两步验证，需要应用专用密码

### 方法 2：手动提交

1. **下载 .ipa 文件**
   ```bash
   eas build:list --platform ios
   eas build:download [BUILD_ID]
   ```

2. **使用 Transporter 或 Xcode**
   - 下载 [Transporter](https://apps.apple.com/app/transporter/id1450874784)
   - 或使用 Xcode 的 Organizer 上传

## 步骤 6：在 App Store Connect 中配置

### 1. 创建应用

1. 访问 [App Store Connect](https://appstoreconnect.apple.com/)
2. 点击 "我的 App" → "+" → "新建 App"
3. 填写信息：
   - **平台**：iOS
   - **名称**：LingAdmin
   - **主要语言**：简体中文
   - **Bundle ID**：com.lingadmin.mobile
   - **SKU**：lingadmin-mobile-ios（唯一标识符）

### 2. 配置应用信息

- **应用描述**：填写应用描述
- **关键词**：相关搜索关键词
- **支持 URL**：应用支持网站
- **营销 URL**（可选）：应用营销网站
- **隐私政策 URL**：必需（如果应用收集用户数据）

### 3. 上传截图和图标

- **应用图标**：1024x1024 像素
- **截图**：需要不同设备尺寸的截图
  - iPhone 6.7"（iPhone 14 Pro Max）
  - iPhone 6.5"（iPhone 11 Pro Max）
  - iPhone 5.5"（iPhone 8 Plus）

### 4. 设置定价和可用性

- 选择价格（免费或付费）
- 选择可用国家/地区
- 设置发布日期

### 5. 提交审核

1. 在 App Store Connect 中完成所有必需信息
2. 点击 "提交以供审核"
3. 回答审核问题
4. 等待审核（通常 1-3 个工作日）

## 常见问题

### Q1: 构建失败，提示证书问题

**解决方案**：
```bash
# 清除凭证并重新配置
eas credentials
# 选择 iOS → 选择项目 → 清除凭证 → 重新生成
```

### Q2: 如何更新版本号？

版本号在 `app.config.js` 中：
```javascript
version: '1.0.0',
```

构建号会自动递增（如果配置了 `autoIncrement: true`）。

### Q3: 如何为不同环境构建？

使用不同的 profile：
```bash
# 生产环境
eas build --platform ios --profile production

# 预览环境（TestFlight）
eas build --platform ios --profile preview

# 开发环境
eas build --platform ios --profile development
```

### Q4: 如何查看构建历史？

```bash
eas build:list --platform ios
```

或在 EAS Dashboard 查看：https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

### Q5: 如何下载构建的 .ipa 文件？

```bash
eas build:download [BUILD_ID]
```

### Q6: 构建需要多长时间？

- 首次构建：15-25 分钟（需要设置凭证）
- 后续构建：10-20 分钟
- 本地构建：取决于机器性能（通常更快）

## 快速命令参考

```bash
# 登录 EAS
eas login

# 配置项目
eas build:configure

# 构建生产版本
eas build --platform ios --profile production

# 构建预览版本
eas build --platform ios --profile preview

# 查看构建列表
eas build:list --platform ios

# 下载构建
eas build:download [BUILD_ID]

# 提交到 App Store
eas submit --platform ios --profile production

# 查看提交状态
eas submit:list --platform ios

# 管理凭证
eas credentials
```

## 成本说明

### EAS Build
- **免费计划**：每月 30 次构建
- **Production 计划**：$29/月，无限构建
- **Enterprise 计划**：$99/月，更多功能

### Apple Developer
- **Apple Developer Program**：$99/年（必需）

## 下一步

1. ✅ 确保 Apple Developer 账号已激活
2. ✅ 运行 `eas build:configure` 配置项目
3. ✅ 运行 `eas build --platform ios --profile production` 构建应用
4. ✅ 运行 `eas submit --platform ios --profile production` 提交到 App Store
5. ✅ 在 App Store Connect 中完成应用信息配置
6. ✅ 提交审核并等待批准

## 相关资源

- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [EAS Submit 文档](https://docs.expo.dev/submit/introduction/)
- [Apple Developer Portal](https://developer.apple.com/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [App Store 审核指南](https://developer.apple.com/app-store/review/guidelines/)

## 支持

如果遇到问题：
1. 查看 [EAS 文档](https://docs.expo.dev/)
2. 访问 [Expo Discord](https://chat.expo.dev/)
3. 查看构建日志：`eas build:view [BUILD_ID]`
