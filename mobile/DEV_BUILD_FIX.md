# 开发构建错误解决方案

## 错误信息

```
CommandError: No development build (com.lingadmin.mobile) for this project is installed. 
Please make and install a development build on the device first.
```

## 原因

项目使用了 `expo-dev-client`，需要先构建并安装开发版本的应用，不能直接使用 Expo Go。

## 解决方案

### 方法 1：本地构建开发版本（推荐，最快）

#### 快速命令

```bash
cd mobile
npm run android:native
```

这个命令会：
1. 检查并预构建原生项目（如果需要）
2. 构建开发版本
3. 自动安装到连接的 Android 设备/模拟器

#### 详细步骤

```bash
# 1. 确保 Android 设备/模拟器已连接
adb devices

# 2. 构建并安装开发版本
npm run android:native

# 3. 启动开发服务器
npm start
```

### 方法 2：使用 EAS Build 构建开发版本

如果需要云端构建：

```bash
# 构建 Android 开发版本
eas build --platform android --profile development

# 等待构建完成（10-20分钟）
# 下载 .apk 文件并安装到设备
```

### 方法 3：使用 Expo Go（不推荐）

如果项目没有使用原生模块，可以临时移除 `expo-dev-client`：

```bash
# 移除 expo-dev-client
npm uninstall expo-dev-client

# 然后可以使用 Expo Go
npm start
```

**注意**：如果项目使用了原生模块或自定义配置，这个方法可能不工作。

## 推荐工作流程

### 首次设置

```bash
# 1. 构建并安装开发版本（只需一次）
npm run android:native

# 2. 启动开发服务器
npm start
```

### 日常开发

```bash
# 1. 启动开发服务器
npm start

# 2. 在已安装的开发版本应用中打开
# 应用会自动连接到开发服务器
```

### 更新原生代码后

如果修改了：
- `app.config.js` 中的原生配置
- 添加了新的原生模块
- 修改了 `android/` 目录中的文件

需要重新构建：

```bash
npm run android:rebuild
```

## 常见问题

### Q1: 构建失败，提示找不到 Android SDK

**解决方案**：
```bash
# 检查 ANDROID_HOME 环境变量
echo $ANDROID_HOME

# 如果未设置，在 WSL 中设置：
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Q2: 构建很慢

**原因**：首次构建需要编译所有原生代码

**解决方案**：
- 首次构建需要 5-10 分钟，这是正常的
- 后续构建会更快（增量构建）
- 可以使用 `--no-build-cache` 强制完整重建

### Q3: 应用安装后无法连接开发服务器

**解决方案**：
1. 确保开发服务器正在运行：`npm start`
2. 确保设备和电脑在同一网络
3. 在应用中手动输入开发服务器地址（如果自动连接失败）

### Q4: 如何切换到 Expo Go？

如果确实需要使用 Expo Go：

1. **移除 expo-dev-client**：
   ```bash
   npm uninstall expo-dev-client
   ```

2. **更新 eas.json**：
   移除 `developmentClient: true` 配置

3. **重新启动**：
   ```bash
   npm start
   ```

**注意**：如果项目使用了原生模块，Expo Go 可能不支持。

## 开发版本 vs Expo Go

| 特性 | 开发版本 | Expo Go |
|------|---------|---------|
| 原生模块支持 | ✅ 完全支持 | ❌ 仅支持 Expo 模块 |
| 自定义原生代码 | ✅ 支持 | ❌ 不支持 |
| 构建时间 | 首次 5-10 分钟 | 无需构建 |
| 热重载 | ✅ 支持 | ✅ 支持 |
| 调试 | ✅ 完整调试 | ✅ 基本调试 |

## 当前项目配置

- ✅ 使用 `expo-dev-client`
- ✅ 支持自定义原生配置
- ✅ 支持所有 React Native 模块

## 快速命令参考

```bash
# 构建并安装开发版本
npm run android:native

# 完全重建（清除所有缓存）
npm run android:rebuild

# 启动开发服务器
npm start

# 卸载应用
npm run android:uninstall

# 查看连接的设备
adb devices
```

## 下一步

1. ✅ 运行 `npm run android:native` 构建开发版本
2. ✅ 等待构建完成（5-10 分钟）
3. ✅ 应用会自动安装到设备
4. ✅ 运行 `npm start` 启动开发服务器
5. ✅ 在应用中打开，会自动连接开发服务器





