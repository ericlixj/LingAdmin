# Expo Go 修复指南

## 问题

即使安装了 Expo Go，仍然报错：
```
CommandError: No development build (com.lingadmin.mobile) for this project is installed.
```

## 原因

项目中有 `expo-dev-client` 依赖，导致 Expo 强制要求使用开发构建而不是 Expo Go。

## 解决方案

### ✅ 已完成的修复

1. **移除了 `expo-dev-client` 依赖**
   - 从 `package.json` 中移除
   - 项目使用的所有模块都支持 Expo Go，不需要开发构建

2. **更新了启动脚本**
   - `npm start` 现在使用 `--go` 标志
   - `start-android.sh` 也使用 `--go` 标志

### 📋 使用步骤

#### 1. 更新依赖

```bash
cd mobile
npm install
```

这会移除 `expo-dev-client` 并更新 `package-lock.json`。

#### 2. 启动开发服务器

```bash
npm start
```

或使用脚本：

```bash
./start-android.sh
```

#### 3. 在 Expo Go 中打开

启动后，在终端中：
- 按 **`a`** 键自动在 Android 模拟器中打开
- 或扫描显示的二维码

## 验证

运行后应该看到：

```
› Opening on Android...
› Opening Expo Go
```

而不是之前的错误信息。

## 如果仍然有问题

### 方法 1：清除缓存

```bash
npm start -- --clear
```

### 方法 2：手动指定 Expo Go

```bash
npx expo start --go
```

### 方法 3：检查 Expo Go 是否安装

```bash
# 在模拟器中检查
adb shell pm list packages | grep expo
```

应该看到：`package:host.exp.exponent`

## 恢复开发构建（如果需要）

如果以后需要使用开发构建：

```bash
# 重新安装 expo-dev-client
npm install expo-dev-client

# 构建开发版本
npm run android:native
```

## 当前配置

- ✅ 使用 Expo Go 模式
- ✅ 移除了 expo-dev-client
- ✅ 所有模块都支持 Expo Go
- ✅ 快速启动，无需构建

## 优势

使用 Expo Go 的好处：
- ⚡ **快速启动**：无需构建，秒级启动
- 🔄 **即时预览**：修改代码立即看到效果
- 🛠️ **简单配置**：不需要 Android SDK 构建环境
- 📱 **适合开发**：快速迭代和测试



