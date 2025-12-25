# 修复 Expo Go 组件导入错误

## 问题

在 Expo Go 中，`SafeAreaProvider` 和 `GestureHandlerRootView` 显示为 `undefined`，导致应用无法启动。

## 原因

Expo Go 对某些原生模块的支持有限，特别是需要原生代码链接的模块。

## 解决方案

### 方案 1: 使用原生构建（推荐）

原生构建包含所有必要的原生代码，可以避免 Expo Go 的限制：

```bash
cd mobile
npm run android:native
```

**注意**：首次构建需要 5-10 分钟。

### 方案 2: 清除缓存并重新启动

```bash
cd mobile

# 1. 清除所有缓存
rm -rf node_modules/.cache .expo .metro

# 2. 重新启动（带清除缓存）
npm start -- --clear
```

### 方案 3: 重新安装依赖

```bash
cd mobile

# 1. 清除缓存
rm -rf node_modules/.cache .expo .metro

# 2. 使用 Expo 安装兼容版本
npx expo install --fix

# 3. 重新启动
npm start -- --clear
```

### 方案 4: 更新 Expo Go

确保 Expo Go 是最新版本：

1. 在模拟器中打开 Google Play Store
2. 搜索 "Expo Go"
3. 更新到最新版本
4. 重新启动应用

## 验证修复

修复后，检查：

1. ✅ 应用能正常启动（没有红色错误屏幕）
2. ✅ 导航正常工作
3. ✅ 安全区域正确显示

## 如果所有方案都失败

使用原生构建是最可靠的解决方案：

```bash
cd mobile
npm run android:native
```

这会构建包含所有原生代码的应用，避免 Expo Go 的限制。
