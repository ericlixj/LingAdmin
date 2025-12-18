# 构建原生 Android 应用指南

## 问题

当前使用的是 **Expo Go**，而不是原生构建的 **LingAdmin** 应用。

## 区别

### Expo Go（当前方式）
- 使用通用的 Expo Go 客户端
- 应用通过 Metro bundler 动态加载
- 不需要单独安装应用
- 但环境变量可能不会正确加载

### 原生构建（推荐）
- 构建独立的 APK（com.lingadmin.mobile）
- 环境变量在编译时正确加载
- 可以完全控制应用配置
- 更接近生产环境

## 构建原生应用

### 方法 1：使用构建脚本（推荐）✅

```bash
cd mobile
npm run android:native
```

这个脚本会：
1. 检查设备连接
2. 预构建原生项目（如果需要）
3. 清除构建缓存
4. 构建并安装原生应用

### 方法 2：手动构建

#### 步骤 1：预构建原生项目（首次需要）

```bash
cd mobile
npx expo prebuild --platform android
```

这会创建 `android/` 目录，包含原生 Android 项目。

#### 步骤 2：构建并安装

```bash
npx expo run:android
```

这会：
- 编译原生代码
- 构建 APK
- 安装到连接的设备/模拟器

### 方法 3：分步构建

```bash
cd mobile

# 1. 预构建（如果还没有 android 目录）
npx expo prebuild --platform android

# 2. 进入 android 目录
cd android

# 3. 使用 Gradle 构建
./gradlew assembleDebug

# 4. 安装到设备
./gradlew installDebug

# 或使用 adb 安装
adb install app/build/outputs/apk/debug/app-debug.apk
```

## 验证原生应用已安装

### 方法 1：使用 adb

```bash
adb shell pm list packages | grep lingadmin
```

应该显示：
```
package:com.lingadmin.mobile
```

### 方法 2：在模拟器中检查

1. 打开应用抽屉
2. 查找 **LingAdmin** 应用（不是 Expo Go）
3. 应用图标应该显示为您的应用图标

### 方法 3：检查应用信息

```bash
adb shell dumpsys package com.lingadmin.mobile | grep versionName
```

## 卸载 Expo Go（可选）

如果您不再需要 Expo Go，可以卸载：

```bash
adb uninstall host.exp.exponent
```

## 使用原生应用

### 启动开发服务器

```bash
cd mobile
npm start
# 或
npx expo start
```

### 在原生应用中加载

原生应用会自动连接到 Metro bundler。如果 Metro bundler 正在运行，应用会自动加载最新代码。

### 重新加载

在应用中：
- 摇动设备打开开发菜单
- 选择 "Reload"
- 或按 `r` 键在 Metro bundler 终端中

## 环境变量配置

原生应用会正确加载 `.env` 文件中的环境变量，因为它们在编译时通过 Babel 插件加载。

确保 `.env` 文件配置正确：

```env
API_BASE_URL=http://10.0.2.2:4000
API_TIMEOUT=30000
```

## 常见问题

### Q: 构建失败，显示 "ANDROID_HOME not set"

A: 确保 Android SDK 路径已设置：

```bash
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### Q: 构建很慢

A: 首次构建需要下载依赖和编译原生代码，可能需要 5-10 分钟。后续构建会更快。

### Q: 如何更新应用？

A: 有两种方式：

1. **开发模式**（推荐）：
   ```bash
   npm start
   # 应用会自动连接到 Metro bundler
   ```

2. **重新构建**：
   ```bash
   npm run android:native
   ```

### Q: 可以同时使用 Expo Go 和原生应用吗？

A: 可以，它们是不同的应用：
- Expo Go: `host.exp.exponent`
- LingAdmin: `com.lingadmin.mobile`

### Q: 原生应用和 Expo Go 的区别是什么？

A:
- **Expo Go**: 通用客户端，快速测试，但功能有限
- **原生应用**: 独立应用，完整功能，环境变量正确加载，更接近生产环境

## 推荐工作流程

1. **开发阶段**：使用原生应用（`npm run android:native`）
2. **快速测试**：可以使用 Expo Go（`npm run android`）
3. **生产构建**：使用 `expo build` 或 EAS Build

## 提示

- 首次构建后，`android/` 目录会被创建
- 可以将 `android/` 目录添加到 `.gitignore`（如果使用 Expo 管理）
- 原生应用会正确加载环境变量，因为它们在编译时处理
- 修改 `.env` 后，需要重新构建或清除缓存并重新加载

