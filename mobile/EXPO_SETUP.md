# Expo 项目设置指南

## 🎉 项目已转换为 Expo 项目

项目已从纯 React Native CLI 转换为 Expo 项目。Expo 的优势：

- ✅ 无需管理原生代码（Android/iOS）
- ✅ 更简单的开发和部署流程
- ✅ 热重载和快速刷新
- ✅ 丰富的 Expo SDK 功能
- ✅ 更容易的构建和发布

## 📦 安装步骤

### 1. 安装依赖

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 删除旧的 node_modules（如果存在）
rm -rf node_modules package-lock.json

# 安装新的依赖
npm install
```

### 2. 安装 Expo CLI（全局，可选）

```bash
npm install -g expo-cli
# 或使用 npx（推荐，不需要全局安装）
```

### 3. 创建必要的资源文件

Expo 需要一些资源文件。创建基本占位符：

```bash
# 创建 assets 目录
mkdir -p assets

# 创建占位符图标（您稍后可以替换为实际图标）
# 注意：这些是占位符，您应该创建实际的图标文件
```

或者使用 Expo 的默认资源：

```bash
# 使用 Expo 的默认图标（临时）
# 您可以在 Expo 文档中找到如何创建自定义图标
```

## 🚀 启动项目

### 开发模式

```bash
# 启动 Expo 开发服务器
npm start
# 或
expo start
```

启动后，您会看到：

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### 在设备上运行

#### Android

**选项 1: 使用 Expo Go 应用（推荐用于开发）**

1. 在 Android 手机上安装 [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. 确保手机和电脑在同一网络
3. 扫描终端中显示的 QR 码
4. 应用会在手机上打开

**选项 2: 在 Android 模拟器上运行**

```bash
# 启动 Android 模拟器（通过 Android Studio）
# 然后在 Expo 终端按 'a' 键
# 或运行：
npm run android
```

#### iOS

**选项 1: 使用 Expo Go 应用（推荐用于开发）**

1. 在 iPhone 上安装 [Expo Go](https://apps.apple.com/app/expo-go/id982107779)
2. 确保手机和电脑在同一网络
3. 扫描终端中显示的 QR 码
4. 应用会在手机上打开

**选项 2: 在 iOS 模拟器上运行（仅 macOS）**

```bash
# 在 Expo 终端按 'i' 键
# 或运行：
npm run ios
```

### Web 版本

```bash
npm run web
```

## 🔧 配置

### 环境变量

环境变量配置保持不变，使用 `.env` 文件：

```env
API_BASE_URL=http://localhost:4000
API_TIMEOUT=30000
```

**注意**：在 Expo 中，真机测试时需要使用电脑的实际 IP 地址：

```env
# 真机测试
API_BASE_URL=http://192.168.1.100:4000

# Android 模拟器
API_BASE_URL=http://10.0.2.2:4000

# iOS 模拟器
API_BASE_URL=http://localhost:4000
```

### 应用配置

主要配置在 `app.json` 或 `app.config.js` 中：

- 应用名称
- 包名（bundle identifier）
- 图标和启动画面
- 权限设置

## 📱 构建和发布

### 开发构建

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账户
eas login

# 配置项目
eas build:configure

# 构建 Android APK
eas build --platform android --profile development

# 构建 iOS（需要 Apple Developer 账户）
eas build --platform ios --profile development
```

### 生产构建

```bash
# 构建生产版本
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 🆚 Expo vs React Native CLI

### Expo 优势

- ✅ 无需管理原生代码
- ✅ 更简单的开发流程
- ✅ 内置很多常用功能（相机、位置等）
- ✅ 更容易的构建和发布
- ✅ 热重载和快速刷新

### Expo 限制

- ⚠️ 某些原生模块可能需要 Expo 插件或 EAS Build
- ⚠️ 自定义原生代码需要 EAS Build（不能直接修改）

### 何时使用 Expo

- ✅ 大多数应用场景
- ✅ 快速原型开发
- ✅ 不需要深度自定义原生代码
- ✅ 团队协作和 CI/CD

## 🐛 常见问题

### 1. Metro Bundler 启动失败

```bash
# 清除缓存
expo start -c
# 或
npm start -- --clear
```

### 2. 无法连接到开发服务器

- 确保手机和电脑在同一网络
- 检查防火墙设置
- 尝试使用隧道模式：`expo start --tunnel`

### 3. 环境变量不生效

Expo 需要重启开发服务器才能读取新的环境变量：

```bash
# 停止当前服务器（Ctrl+C）
# 重新启动
npm start
```

### 4. 构建失败

```bash
# 清除缓存
expo start -c

# 检查配置
eas build:configure
```

## 📚 更多资源

- [Expo 官方文档](https://docs.expo.dev/)
- [Expo Router 文档](https://docs.expo.dev/router/introduction/)
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [Expo SDK API 参考](https://docs.expo.dev/versions/latest/)

## 🎯 下一步

1. ✅ 安装依赖：`npm install`
2. ✅ 启动开发服务器：`npm start`
3. ✅ 在设备或模拟器上运行应用
4. ✅ 开始开发！

## 💡 提示

- 使用 Expo Go 进行快速开发和测试
- 使用 EAS Build 进行生产构建
- 定期更新 Expo SDK 以获得最新功能和安全修复
- 使用 `expo-doctor` 检查项目配置：`npx expo-doctor`







