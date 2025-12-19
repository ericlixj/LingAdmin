# iOS 快速开始

## 前置检查清单

- [ ] Apple Developer 账号（$99/年）
- [ ] EAS 账号（免费注册）
- [ ] 已登录 EAS：`eas login`
- [ ] iPhone 设备（用于测试）

## 场景 1：安装到自己的手机测试（推荐）

### 快速步骤

#### 1. 首次配置（只需一次）

```bash
cd mobile
eas build:configure
```

选择 iOS 平台，EAS 会自动设置凭证。

#### 2. 构建预览版本

```bash
# 预览版本（适合功能测试）
npm run ios:build:preview

# 或使用 EAS 命令
eas build --platform ios --profile preview
```

#### 3. 安装到 iPhone

1. 构建完成后，EAS 会提供下载链接
2. 在 iPhone 的 **Safari 浏览器**中打开链接
3. 点击下载并安装
4. 前往 **设置 > 通用 > VPN与设备管理**
5. 信任开发者证书
6. 返回主屏幕启动应用

### 开发版本（支持热重载）

```bash
# 开发版本（支持调试）
npm run ios:build:dev

# 或
eas build --platform ios --profile development
```

## 场景 2：发布到 App Store

### 快速步骤

#### 1. 构建生产版本

```bash
npm run ios:build
```

#### 2. 提交到 App Store

```bash
npm run ios:submit
```

#### 3. 在 App Store Connect 完成配置

1. 访问 https://appstoreconnect.apple.com/
2. 创建新应用
3. 填写应用信息、上传截图
4. 提交审核

## 常用命令

```bash
# 查看构建列表
eas build:list --platform ios

# 下载构建文件
eas build:download [BUILD_ID]

# 查看构建详情
eas build:view [BUILD_ID]

# 管理凭证
eas credentials

# 注册设备（Ad Hoc 分发）
eas device:create
```

## 详细文档

- **安装到设备测试**：查看 [IOS_DEVICE_TESTING.md](./IOS_DEVICE_TESTING.md)
- **发布到 App Store**：查看 [IOS_RELEASE_GUIDE.md](./IOS_RELEASE_GUIDE.md)
