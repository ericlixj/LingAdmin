# Expo 快速启动指南

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 删除旧的依赖（如果存在）
rm -rf node_modules package-lock.json

# 安装新依赖
npm install
```

### 2. 配置环境变量

确保 `.env` 文件存在并配置正确：

```env
API_BASE_URL=http://localhost:4000
API_TIMEOUT=30000
```

**不同环境的配置**：
- **Android 模拟器**: `API_BASE_URL=http://10.0.2.2:4000`
- **iOS 模拟器**: `API_BASE_URL=http://localhost:4000`
- **真机**: `API_BASE_URL=http://192.168.1.100:4000` (替换为您的电脑 IP)

### 3. 启动开发服务器

```bash
npm start
# 或
expo start
```

### 4. 运行应用

启动后，您会看到 QR 码和选项：

```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

#### 选项 A: 使用 Expo Go（推荐用于开发）

1. **在手机上安装 Expo Go**：
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **扫描 QR 码**：
   - Android: 使用 Expo Go 应用扫描
   - iOS: 使用相机应用扫描

3. **应用会自动打开**

#### 选项 B: 在模拟器上运行

**Android 模拟器**（需要 Android Studio）：
```bash
# 确保 Android 模拟器已启动
# 然后按 'a' 键或运行：
npm run android
```

**⚠️ 注意**：如果遇到 Android SDK 路径错误，请参考 [ANDROID_SETUP.md](./ANDROID_SETUP.md) 配置环境变量。

**推荐**：使用 Expo Go（选项 A）更简单，无需配置 Android SDK。

**iOS 模拟器**（仅 macOS）：
```bash
# 按 'i' 键或运行：
npm run ios
```

## 📱 开发流程

### 热重载

Expo 支持热重载，修改代码后应用会自动更新：

- **Fast Refresh**: 自动刷新组件
- **Live Reload**: 完全重新加载应用

### 开发者菜单

在设备或模拟器上：

- **Android**: 摇动设备或按 `Cmd+M` (Mac) / `Ctrl+M` (Windows/Linux)
- **iOS**: 摇动设备或按 `Cmd+D` (Mac)

### 常用命令

```bash
# 启动开发服务器
npm start

# 清除缓存并启动
npm start -- --clear

# 使用隧道模式（如果网络有问题）
expo start --tunnel

# 在 Android 模拟器运行
npm run android

# 在 iOS 模拟器运行
npm run ios

# 在 Web 浏览器运行
npm run web
```

## 🔧 配置说明

### app.json / app.config.js

主要配置文件，包含：
- 应用名称和版本
- 图标和启动画面
- 包名（bundle identifier）
- 权限设置

### 环境变量

使用 `.env` 文件配置 API 地址等环境变量。

## 🐛 常见问题

### 1. 无法连接到开发服务器

**问题**: 手机无法连接到开发服务器

**解决**:
```bash
# 使用隧道模式
expo start --tunnel

# 或确保手机和电脑在同一网络
# 检查防火墙设置
```

### 2. Metro Bundler 启动失败

**解决**:
```bash
# 清除缓存
npm start -- --clear

# 或
expo start -c
```

### 3. 环境变量不生效

**解决**:
- 重启开发服务器
- 确保 `.env` 文件格式正确
- 检查变量名是否正确

### 4. 构建错误

**解决**:
```bash
# 清除所有缓存
rm -rf node_modules
npm install
expo start -c
```

## 📚 更多资源

- [完整设置指南](./EXPO_SETUP.md)
- [Expo 官方文档](https://docs.expo.dev/)
- [Expo SDK API](https://docs.expo.dev/versions/latest/)

## ✅ 检查清单

- [ ] 已安装依赖 (`npm install`)
- [ ] 已配置 `.env` 文件
- [ ] 后端服务运行中 (`capp/backend` 在端口 4000)
- [ ] 已启动 Expo 开发服务器 (`npm start`)
- [ ] 已在设备或模拟器上打开应用

## 🎯 下一步

1. 启动开发服务器
2. 在设备或模拟器上打开应用
3. 开始开发！


