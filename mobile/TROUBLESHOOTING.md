# 故障排除指南

## ❌ ConfigError: Cannot determine the project's Expo SDK version

### 问题描述

```
ConfigError: Cannot determine the project's Expo SDK version because the module `expo` is not installed.
```

### 原因

这个错误通常出现在以下情况：

1. **项目缺少原生代码目录**：React Native CLI 项目需要 `android` 和 `ios` 目录
2. **工具误判项目类型**：某些工具看到 `app.json` 误认为是 Expo 项目

### 解决方案

#### 方案 1: 初始化原生代码（推荐）

这个项目是**纯 React Native CLI 项目**，不是 Expo 项目。需要初始化原生代码：

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile

# 运行初始化脚本
./init-native.sh
```

如果脚本不工作，手动初始化：

```bash
# 创建临时项目获取原生代码
npx react-native@0.73.0 init LingAdminTemp --skip-install --directory /tmp/rn_temp

# 复制原生目录
cp -r /tmp/rn_temp/android .
cp -r /tmp/rn_temp/ios .

# 清理
rm -rf /tmp/rn_temp
```

**对于 iOS（仅 macOS）**：
```bash
cd ios
pod install
cd ..
```

#### 方案 2: 检查项目结构

确保项目有以下目录结构：

```
mobile/
├── android/          # ✅ 必需
├── ios/              # ✅ 必需（仅 macOS）
├── src/
├── App.tsx
├── index.js
├── package.json
└── ...
```

如果缺少 `android` 或 `ios` 目录，使用方案 1 初始化。

#### 方案 3: 清除缓存重新启动

```bash
# 清除 Metro 缓存
npm start -- --reset-cache

# 清除 watchman 缓存（如果安装了）
watchman watch-del-all

# 清除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 验证

初始化后，检查目录：

```bash
ls -la android ios
```

应该看到原生代码目录。

### 下一步

原生代码初始化后：

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **iOS 安装 Pods**（仅 macOS）：
   ```bash
   cd ios && pod install && cd ..
   ```

3. **启动应用**：
   ```bash
   npm start          # 终端 1
   npm run android    # 终端 2（Android）
   # 或
   npm run ios        # 终端 2（iOS）
   ```

## 其他常见错误

### Metro Bundler 启动失败

```bash
# 清除缓存
npm start -- --reset-cache

# 检查端口占用
lsof -ti:8081
kill -9 <PID>
```

### Android 构建失败

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS 构建失败

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### 环境变量不生效

```bash
# 确保 .env 文件存在
ls -la .env

# 重启 Metro Bundler
npm start -- --reset-cache
```

## 需要帮助？

如果问题仍然存在：

1. 检查 [QUICK_START.md](./QUICK_START.md) 获取详细步骤
2. 检查 [README.md](./README.md) 获取项目说明
3. 查看 React Native 官方文档







