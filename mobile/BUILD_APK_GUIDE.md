# Android APK 构建和发布指南

## 前置要求

1. **安装 EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **登录 Expo 账户**
   ```bash
   eas login
   ```

3. **配置项目（如果首次构建）**
   ```bash
   eas build:configure
   ```

## 构建配置

当前 `eas.json` 已配置了三个构建环境：

- **development**: 开发版本（developmentClient）
- **preview**: 预览版本（内部测试）
- **production**: 生产版本（发布用）

## 构建 APK

### 1. 生产环境构建（推荐）

```bash
cd mobile
npm run android:build:production
```

或者直接使用 EAS 命令：

```bash
cd mobile
eas build --platform android --profile production
```

### 2. 预览环境构建（测试用）

```bash
cd mobile
npm run android:build:preview
```

或者：

```bash
eas build --platform android --profile preview
```

### 3. 开发环境构建

```bash
cd mobile
npm run android:build:dev
```

或者：

```bash
eas build --platform android --profile development
```

## 构建选项

构建时会提示你选择：

1. **构建类型**：
   - `APK` - 用于直接安装（已配置）
   - `AAB` - 用于 Google Play 商店发布

2. **构建方式**：
   - `Cloud (EAS Build)` - 推荐，在 Expo 云端构建
   - `Local` - 本地构建（需要 Android SDK）

## 构建流程

1. **启动构建**
   ```bash
   eas build --platform android --profile production
   ```

2. **选择构建选项**
   - 选择 `APK` 或 `AAB`
   - 选择云端构建或本地构建

3. **等待构建完成**
   - 云端构建通常需要 10-20 分钟
   - 可以在 Expo 控制台查看进度：https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

4. **下载 APK**
   - 构建完成后，EAS 会提供下载链接
   - 或使用命令下载：
     ```bash
     eas build:list
     eas build:download [BUILD_ID]
     ```

## 环境变量

生产环境构建使用的环境变量（在 `eas.json` 中配置）：

```json
{
  "API_BASE_URL": "https://c-api.kxf.ca",
  "API_BASE_URL_IOS": "https://c-api.kxf.ca",
  "API_BASE_URL_ANDROID": "https://c-api.kxf.ca",
  "API_TIMEOUT": "30000"
}
```

## 发布 APK

### 方式 1: 直接安装

构建完成后，下载 APK 文件，直接安装到 Android 设备：

```bash
# 下载 APK
eas build:download [BUILD_ID]

# 安装到设备（需要 adb）
adb install path/to/app.apk
```

### 方式 2: 通过链接分享

EAS 构建完成后会生成一个下载链接，可以分享给其他人安装。

### 方式 3: 上传到 Google Play（需要 AAB）

如果要发布到 Google Play 商店，需要构建 AAB 格式：

1. 修改 `eas.json` 中的 `buildType` 为 `"aab"`（或构建时选择）
2. 构建 AAB：
   ```bash
   eas build --platform android --profile production
   # 选择 AAB 格式
   ```
3. 提交到 Google Play：
   ```bash
   eas submit --platform android
   ```

## 快速构建命令

```bash
# 进入 mobile 目录
cd mobile

# 生产环境构建 APK
eas build --platform android --profile production

# 查看构建列表
eas build:list

# 下载最新构建
eas build:download --latest --platform android
```

## 常见问题

### 1. 构建失败

- 检查 `eas.json` 配置是否正确
- 检查 `app.config.js` 中的配置
- 查看构建日志：https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

### 2. 环境变量未生效

- 确保在 `eas.json` 的对应 profile 中配置了环境变量
- 重新构建应用

### 3. APK 安装失败

- 确保设备允许安装未知来源的应用
- 检查 Android 版本兼容性
- 卸载旧版本后再安装

## 验证构建

构建完成后，可以：

1. **检查版本号**：在 `app.config.js` 中查看 `version`
2. **测试 API 连接**：确保生产环境 API 地址正确
3. **功能测试**：安装后测试所有功能模块

## 注意事项

1. **版本号自动递增**：`production` profile 已启用 `autoIncrement: true`，每次构建会自动递增版本号
2. **构建时间**：云端构建通常需要 10-20 分钟
3. **构建配额**：免费账户有构建次数限制，注意使用
4. **API 地址**：确保生产环境使用正确的 API 地址
