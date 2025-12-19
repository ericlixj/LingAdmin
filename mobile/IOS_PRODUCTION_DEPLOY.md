# iOS Production 环境部署指南

本指南说明如何部署 iOS 应用到真机，使用 production 环境配置。

## Production 环境配置

Production 环境使用以下配置：

- **API 地址**: `https://c-api.kxf.ca`
- **构建配置**: Release
- **环境变量**: 在 `eas.json` 中已配置

## 部署方法

### 方法 1：EAS Build（推荐用于发布）

使用 EAS Build 构建 production 版本，会自动使用 production 环境配置：

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 构建 iOS production 版本
npm run ios:build

# 或直接使用 EAS
eas build --platform ios --profile production
```

**特点**：
- ✅ 自动使用 production 环境变量
- ✅ 适合发布到 App Store
- ✅ 云端构建，不需要本地 Xcode

### 方法 2：本地 Xcode 构建（推荐用于真机测试）

#### 步骤 1：设置环境变量

创建或修改 `.env` 文件，设置为 production API：

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 创建 .env 文件（如果不存在）
cat > .env << EOF
API_BASE_URL=https://c-api.kxf.ca
API_TIMEOUT=30000
NODE_ENV=production
EOF
```

#### 步骤 2：重新构建 iOS 项目

```bash
# 删除旧的 iOS 项目
rm -rf ios

# 重新预构建（会使用 .env 中的配置）
npx expo prebuild --platform ios

# 或如果已存在，直接构建
npm run ios -- --device
```

#### 步骤 3：在 Xcode 中构建 Release 版本

```bash
# 打开 Xcode
open ios/*.xcworkspace
```

在 Xcode 中：
1. 选择 **Product > Scheme > Edit Scheme...**
2. 选择 **Run**，将 **Build Configuration** 设置为 **Release**
3. 选择你的 iPhone 作为运行目标
4. 点击运行按钮（▶️）或按 `Cmd+R`

### 方法 3：使用 Expo CLI（最简单）

如果使用本地构建，Expo CLI 会使用 `.env` 文件中的配置：

```bash
# 确保 .env 文件包含 production 配置
API_BASE_URL=https://c-api.kxf.ca
NODE_ENV=production

# 部署到设备
npm run ios -- --device
```

## 验证 Production 环境

部署后，可以通过以下方式验证：

1. **在应用中检查**：
   - 打开应用首页
   - 查看环境配置区域，应该显示 "生产环境"
   - API 地址应该显示 `https://c-api.kxf.ca`

2. **检查网络请求**：
   - 在应用中执行任何 API 调用
   - 确认请求发送到 `https://c-api.kxf.ca`

## 配置说明

### EAS Build 配置

`eas.json` 中的 production 配置：

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

### 应用配置

`app.config.js` 中的配置会使用环境变量：

```javascript
extra: {
  apiBaseUrl: process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://c-api.kxf.ca' : 'http://localhost:4000'),
  apiTimeout: process.env.API_TIMEOUT || '30000',
}
```

## 快速部署脚本

我创建了一个快速部署脚本：

```bash
# 使用 production 环境部署到 iOS 真机
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile
./deploy-ios-production.sh
```

## 常见问题

### Q1: 如何确认使用的是 production 环境？

**检查方式**：
1. 在应用中查看设置页面，当前环境应该显示 "生产环境"
2. API 地址应该显示 `https://c-api.kxf.ca`
3. 网络请求应该发送到 production 服务器

### Q2: 本地构建时如何确保使用 production？

**解决方案**：
1. 在 `.env` 文件中设置：
   ```env
   API_BASE_URL=https://c-api.kxf.ca
   NODE_ENV=production
   ```
2. 重新构建：`rm -rf ios && npx expo prebuild --platform ios`
3. 在 Xcode 中构建 Release 版本

### Q3: EAS Build 和本地构建的区别？

- **EAS Build**: 使用 `eas.json` 中配置的环境变量，无需 `.env` 文件
- **本地构建**: 使用 `.env` 文件中的配置（如果存在）或代码默认值

### Q4: 可以在应用中切换环境吗？

是的！应用支持运行时切换环境：
- 在首页可以快速切换环境
- 在设置页面可以查看和切换环境
- 切换后需要重新登录

但如果是 production 构建，默认会使用 production API。

## 部署 Checklist

- [ ] 确认 `eas.json` 中 production 配置正确
- [ ] 确认 API 地址为 `https://c-api.kxf.ca`
- [ ] 如果本地构建，设置 `.env` 文件
- [ ] 重新构建 iOS 项目（如果修改了配置）
- [ ] 在 Xcode 中选择 Release 配置（本地构建）
- [ ] 部署到设备并验证 API 地址
- [ ] 测试应用功能确保连接到正确的服务器

## 相关文档

- [IOS_DEVICE_DEPLOY.md](./IOS_DEVICE_DEPLOY.md) - iOS 真机部署详细指南
- [ENVIRONMENT_CONFIG.md](./ENVIRONMENT_CONFIG.md) - 环境配置说明
- [EAS_BUILD_GUIDE.md](./EAS_BUILD_GUIDE.md) - EAS Build 指南

