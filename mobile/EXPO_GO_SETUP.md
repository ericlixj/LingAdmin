# Expo Go 开发设置指南

本指南说明如何使用 Expo Go 进行本地模拟器开发。

## 什么是 Expo Go？

Expo Go 是 Expo 提供的通用应用，可以运行任何使用标准 Expo API 的项目，无需构建原生应用。

## 优势

- ✅ **快速启动**：无需构建，直接启动开发服务器
- ✅ **即时预览**：修改代码后立即看到效果
- ✅ **无需配置**：不需要 Android SDK 或 Xcode
- ✅ **适合开发**：快速迭代和测试

## 限制

- ❌ **不支持自定义原生模块**：只能使用 Expo 提供的模块
- ❌ **不支持自定义原生代码**：不能修改 `android/` 或 `ios/` 目录
- ❌ **某些功能受限**：部分高级功能需要开发构建

## 设置步骤

### 1. 安装 Expo Go（如果还没安装）

#### Android 模拟器

1. 在模拟器中打开 **Google Play Store**
2. 搜索 **"Expo Go"**
3. 点击安装

或直接访问：
https://play.google.com/store/apps/details?id=host.exp.exponent

#### iOS 模拟器

1. 在模拟器中打开 **App Store**
2. 搜索 **"Expo Go"**
3. 点击安装

或直接访问：
https://apps.apple.com/app/expo-go/id982107779

### 2. 启动开发服务器

```bash
cd mobile
npm start
```

或使用脚本：

```bash
./start-android.sh
```

### 3. 在 Expo Go 中打开项目

#### 方法 1：自动打开（推荐）

启动开发服务器后，按键盘上的：
- **`a`** - 在 Android 模拟器中打开
- **`i`** - 在 iOS 模拟器中打开

#### 方法 2：扫描二维码

1. 在终端中会显示一个二维码
2. 在 Expo Go 应用中点击 **"Scan QR code"**
3. 扫描终端中的二维码

#### 方法 3：手动输入 URL

1. 在 Expo Go 应用中点击 **"Enter URL manually"**
2. 输入终端中显示的 URL（例如：`exp://192.168.1.100:8081`）

## 工作流程

```
1. 启动开发服务器
   npm start

2. 在 Expo Go 中打开项目
   - 按 'a' 键（Android）
   - 或扫描二维码

3. 修改代码
   - 保存文件
   - 应用自动热重载

4. 查看效果
   - 在 Expo Go 中立即看到更改
```

## 切换到 Expo Go

如果项目当前使用 `expo-dev-client`，需要移除它：

### 方法 1：临时移除（推荐用于测试）

```bash
# 移除 expo-dev-client
npm uninstall expo-dev-client

# 清除缓存
npm start -- --clear
```

### 方法 2：保留在 package.json 中（不安装）

如果不想完全移除，可以：
1. 保留 `expo-dev-client` 在 `package.json` 中
2. 但不要运行构建命令
3. 直接使用 `npm start` 启动 Expo Go

## 当前项目状态

### 检查是否可以使用 Expo Go

项目使用的模块：
- ✅ `@react-native-async-storage/async-storage` - 支持
- ✅ `@react-navigation/*` - 支持
- ✅ `axios` - 支持
- ✅ `expo-constants` - 支持
- ✅ `expo-linking` - 支持
- ✅ `react-native-gesture-handler` - 支持
- ✅ `react-native-reanimated` - 支持（Expo Go 支持）
- ✅ `react-native-safe-area-context` - 支持
- ✅ `react-native-screens` - 支持

**结论**：✅ 项目可以使用 Expo Go！

## 常用命令

```bash
# 启动开发服务器
npm start

# 清除缓存并启动
npm start -- --clear

# 在 Android 模拟器中打开（启动后按 'a'）
npm start

# 在 iOS 模拟器中打开（启动后按 'i'）
npm start
```

## 故障排查

### 问题 1：Expo Go 无法连接

**解决方案**：
1. 确保设备和电脑在同一网络
2. 检查防火墙设置
3. 尝试使用 `--tunnel` 模式：
   ```bash
   npx expo start --tunnel
   ```

### 问题 2：热重载不工作

**解决方案**：
```bash
# 清除缓存
npm start -- --clear
```

### 问题 3：某些功能不工作

**可能原因**：使用了 Expo Go 不支持的模块

**解决方案**：
- 检查模块是否在 [Expo 兼容性列表](https://docs.expo.dev/bare/overview/) 中
- 如果不在，需要使用开发构建（`expo-dev-client`）

## Expo Go vs 开发构建

| 特性 | Expo Go | 开发构建 |
|------|---------|---------|
| 启动速度 | 快（秒级） | 慢（需要构建） |
| 自定义原生代码 | ❌ | ✅ |
| 自定义原生模块 | ❌ | ✅ |
| 适合场景 | 快速开发、原型 | 生产应用、高级功能 |
| 需要构建 | ❌ | ✅ |

## 下一步

1. ✅ 在模拟器上安装 Expo Go
2. ✅ 运行 `npm start`
3. ✅ 在 Expo Go 中打开项目
4. ✅ 开始开发！

## 相关文档

- [Expo Go 文档](https://docs.expo.dev/get-started/expo-go/)
- [Expo 兼容性](https://docs.expo.dev/bare/overview/)
- [开发工作流程](https://docs.expo.dev/workflow/development-builds/)





