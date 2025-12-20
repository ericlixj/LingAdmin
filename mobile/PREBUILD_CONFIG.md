# Prebuild 配置说明

## 问题

`expo doctor` 报告：
```
This project contains native project folders but also has native configuration 
properties in app.config.js, indicating it is configured to use Prebuild.
```

## 原因

项目同时存在：
1. `android/` 和 `ios/` 原生文件夹（已生成）
2. `app.config.js` 中的原生配置（orientation, icon, splash 等）

当使用 **Continuous Native Generation (CNG / Prebuild)** 时，这些配置应该从 `app.config.js` 自动同步到原生项目。

## 解决方案

### ✅ 已完成的修复

1. **将 `android/` 和 `ios/` 添加到 `.gitignore`**
   - 根目录 `.gitignore`
   - `mobile/.gitignore`

2. **从 Git 中移除跟踪**
   - 使用 `git rm -r --cached` 移除跟踪
   - 保留本地文件夹（用于本地开发）

### 📋 工作流程

#### 使用 Prebuild（推荐）

```bash
# 生成原生项目（如果需要）
npx expo prebuild

# 构建
npx expo run:android
# 或
npx expo run:ios
```

#### 使用 EAS Build

EAS Build 会自动运行 `expo prebuild`，从 `app.config.js` 生成原生配置。

### ⚠️ 重要提示

1. **不要提交 `android/` 和 `ios/` 到 Git**
   - 这些文件夹由 Prebuild 自动生成
   - 配置在 `app.config.js` 中管理

2. **本地开发**
   - 本地可以保留这些文件夹
   - 用于本地构建和调试

3. **EAS Build**
   - EAS Build 会自动运行 Prebuild
   - 从 `app.config.js` 同步配置

## 配置说明

### app.config.js 中的配置

这些配置会被 Prebuild 同步到原生项目：

- `orientation` - 屏幕方向
- `icon` - 应用图标
- `userInterfaceStyle` - UI 样式
- `splash` - 启动画面
- `ios.*` - iOS 特定配置
- `android.*` - Android 特定配置
- `plugins` - Expo 插件
- `scheme` - URL scheme

### 当前配置

- ✅ `android/` 和 `ios/` 已添加到 `.gitignore`
- ✅ 从 Git 中移除了跟踪
- ✅ 保留本地文件夹用于开发
- ✅ `app.config.js` 包含所有原生配置

## 验证

运行 `expo doctor` 应该不再报告此问题：

```bash
npx expo-doctor
```

## 相关文档

- [Expo Prebuild 文档](https://docs.expo.dev/workflow/prebuild/)
- [Continuous Native Generation](https://docs.expo.dev/workflow/prebuild/#continuous-native-generation)
- [EAS Build 和 Prebuild](https://docs.expo.dev/build/introduction/#eas-build-and-prebuild)


