# Expo Go 升级提示修复

## 问题

```
CommandError: Input is required, but 'npx expo' is in non-interactive mode.
Required input:
> Expo Go on Pixel_8 is outdated, would you like to upgrade?
```

同时还有：
```
Metro is running in CI mode, reloads are disabled.
```

## 原因

1. **`CI=true` 的问题**：
   - 禁用了热重载功能
   - 导致 Metro 运行在 CI 模式
   - 无法进行交互式提示

2. **Expo Go 版本过旧**：
   - 模拟器上的 Expo Go 版本需要更新
   - Expo 尝试询问是否升级，但非交互模式无法处理

## 解决方案

### ✅ 已应用的修复

1. **移除了 `CI=true`**
   - 恢复热重载功能
   - Metro 正常运行

2. **使用 `--non-interactive` 标志**
   - 处理交互式提示
   - 但不影响热重载

3. **更新启动命令**
   ```bash
   npx expo start --go --android --non-interactive
   ```

### 📋 解决 Expo Go 版本问题

#### 方法 1：在模拟器中更新 Expo Go（推荐）

1. 在模拟器中打开 **Google Play Store**
2. 搜索 **"Expo Go"**
3. 如果有更新，点击 **"更新"**

#### 方法 2：手动打开项目

如果 Expo Go 版本过旧，可以：

1. 启动开发服务器：
   ```bash
   npm start
   ```

2. **不要按 'a' 键自动打开**

3. 在 Expo Go 应用中：
   - 点击 **"Scan QR code"**
   - 扫描终端中的二维码
   - 或手动输入 URL

#### 方法 3：重新安装 Expo Go

如果更新失败：

1. 卸载旧版本 Expo Go
2. 从 Google Play Store 重新安装最新版本

## 当前配置

- ✅ 使用 `--non-interactive` 标志
- ✅ 保持热重载功能
- ✅ 避免交互式提示错误
- ✅ 支持自动打开（如果 Expo Go 版本匹配）

## 使用步骤

### 1. 确保 Expo Go 是最新版本

```bash
# 在模拟器中打开 Google Play Store
# 搜索并更新 Expo Go
```

### 2. 启动开发服务器

```bash
npm start
```

或：

```bash
./start-android.sh
```

### 3. 打开项目

- **如果 Expo Go 是最新版本**：按 `a` 键自动打开
- **如果版本过旧**：在 Expo Go 中手动扫描二维码

## 验证

启动后应该看到：

```
Starting Metro Bundler
› Opening exp://... on Pixel_8
```

而不是错误信息。

## 如果仍然有问题

### 方案 1：跳过自动打开

```bash
# 只启动服务器，不自动打开
npx expo start --go
```

然后在 Expo Go 中手动扫描二维码。

### 方案 2：更新 Expo Go

确保 Expo Go 是最新版本：
- Android: Google Play Store
- iOS: App Store

### 方案 3：清除缓存

```bash
npm start -- --clear
```

## 技术说明

### `--non-interactive` vs `CI=true`

| 特性 | `--non-interactive` | `CI=true` |
|------|-------------------|-----------|
| 热重载 | ✅ 启用 | ❌ 禁用 |
| 交互式提示 | ❌ 禁用 | ❌ 禁用 |
| Metro 模式 | 正常模式 | CI 模式 |
| 推荐使用 | ✅ 是 | ❌ 否 |

### 为什么移除 `CI=true`？

`CI=true` 会：
- 禁用热重载（watch mode）
- 导致 Metro 运行在 CI 模式
- 影响开发体验

`--non-interactive` 只：
- 禁用交互式提示
- 不影响热重载
- 保持正常开发模式

## 相关文档

- [Expo Go 文档](https://docs.expo.dev/get-started/expo-go/)
- [Expo CLI 选项](https://docs.expo.dev/workflow/expo-cli/)

