# React Native 项目快速启动指南

## 📋 前置要求检查

### 1. Node.js
确保已安装 Node.js >= 18：

```bash
node --version
# 应该显示 v18.x.x 或更高版本
```

如果没有安装，请访问 [Node.js 官网](https://nodejs.org/) 下载安装。

### 2. 包管理器
选择 npm 或 yarn：

```bash
npm --version
# 或
yarn --version
```

### 3. Android 开发环境（仅 Android）

**必需组件**：
- ✅ Android Studio
- ✅ JDK 17 或更高版本
- ✅ Android SDK
- ✅ Android 模拟器或真机

**安装步骤**：
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 打开 Android Studio，安装 Android SDK
3. 配置环境变量（添加到 `~/.bashrc` 或 `~/.zshrc`）：

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
# 或
export ANDROID_HOME=$HOME/Android/Sdk  # Linux

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

4. 验证安装：

```bash
adb --version
```

### 4. iOS 开发环境（仅 macOS + iOS）

**必需组件**：
- ✅ Xcode（从 App Store 安装）
- ✅ Xcode Command Line Tools
- ✅ CocoaPods

**安装步骤**：
1. 从 App Store 安装 Xcode
2. 安装 Command Line Tools：

```bash
xcode-select --install
```

3. 安装 CocoaPods：

```bash
sudo gem install cocoapods
```

4. 安装 iOS 依赖（在项目目录）：

```bash
cd ios
pod install
cd ..
```

## 🚀 启动步骤

### 步骤 1: 进入项目目录

```bash
cd /home/ericl/source_code/workspace_fullstack/LingAdmin/mobile
```

### 步骤 1.5: 初始化原生代码（首次需要）

**重要**：如果项目缺少 `android` 和 `ios` 目录，需要先初始化原生代码：

```bash
# 运行初始化脚本
./init-native.sh

# 或手动初始化（如果脚本不工作）
npx react-native@0.73.0 init LingAdminTemp --skip-install --directory /tmp/rn_temp
cp -r /tmp/rn_temp/android .
cp -r /tmp/rn_temp/ios .
rm -rf /tmp/rn_temp
```

**对于 iOS（仅 macOS）**：
```bash
cd ios
pod install
cd ..
```

### 步骤 2: 安装依赖

```bash
npm install
# 或
yarn install
```

**注意**：首次安装可能需要几分钟时间。

### 步骤 3: 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，根据您的环境配置：

#### Android 模拟器
```env
API_BASE_URL=http://10.0.2.2:4000
```

#### iOS 模拟器
```env
API_BASE_URL=http://localhost:4000
```

#### 真机测试
首先获取您的电脑 IP 地址：

**Linux/Mac**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows**:
```cmd
ipconfig | findstr IPv4
```

然后在 `.env` 中配置：
```env
API_BASE_URL=http://192.168.1.100:4000  # 替换为您的实际 IP
```

### 步骤 4: 确保后端服务运行

确保 `capp/backend` 正在运行（端口 4000）：

```bash
# 检查后端是否运行
curl http://localhost:4000/api/c/health

# 如果未运行，启动它（根据您的部署方式）
# Docker:
docker-compose up capp-backend

# 或直接运行:
cd ../capp/backend
npm start
```

### 步骤 5: 启动 Metro Bundler

在一个终端窗口中启动 Metro Bundler：

```bash
npm start
# 或
yarn start
```

Metro Bundler 启动后，您会看到：
```
Metro waiting on exp://192.168.x.x:8081
```

**保持这个终端窗口打开！**

### 步骤 6: 启动应用

#### Android

**方式 1: 使用命令行（推荐）**

在新的终端窗口中：

```bash
npm run android
# 或
yarn android
```

**方式 2: 使用 Android Studio**

1. 打开 Android Studio
2. 打开项目：`File > Open > mobile/android`
3. 等待 Gradle 同步完成
4. 点击运行按钮或按 `Shift+F10`

**首次运行可能需要较长时间**（下载依赖、构建等）

#### iOS（仅 macOS）

**方式 1: 使用命令行（推荐）**

```bash
npm run ios
# 或
yarn ios
```

**方式 2: 使用 Xcode**

1. 打开 Xcode
2. 打开项目：`File > Open > mobile/ios/LingAdmin.xcworkspace`
3. 选择模拟器或真机
4. 点击运行按钮或按 `Cmd+R`

## 🔧 常用命令

### 开发命令

```bash
# 启动 Metro Bundler
npm start

# 启动 Android 应用
npm run android

# 启动 iOS 应用
npm run ios

# 清除缓存并重启
npm start -- --reset-cache

# 运行测试
npm test

# 代码检查
npm run lint
```

### Android 特定命令

```bash
# 查看连接的设备
adb devices

# 查看日志
adb logcat

# 清除应用数据
adb shell pm clear com.lingadmin

# 重新安装应用
adb uninstall com.lingadmin
npm run android
```

### iOS 特定命令

```bash
# 清理构建
cd ios
xcodebuild clean
cd ..

# 重新安装 Pods
cd ios
pod deintegrate
pod install
cd ..
```

## 🐛 常见问题解决

### 1. Metro Bundler 启动失败

**问题**: `Error: Cannot find module 'xxx'`

**解决**:
```bash
# 删除 node_modules 和锁定文件
rm -rf node_modules package-lock.json yarn.lock

# 重新安装
npm install

# 清除 Metro 缓存
npm start -- --reset-cache
```

### 2. Android 构建失败

**问题**: `Gradle build failed`

**解决**:
```bash
cd android

# 清理构建
./gradlew clean

# 如果还有问题，删除 .gradle 目录
rm -rf .gradle

cd ..
npm run android
```

### 3. iOS 构建失败

**问题**: `Pod installation failed`

**解决**:
```bash
cd ios

# 更新 CocoaPods
sudo gem install cocoapods

# 清理并重新安装
pod deintegrate
pod install

cd ..
npm run ios
```

### 4. 无法连接到后端 API

**问题**: `Network request failed` 或 `Connection refused`

**解决**:

1. **检查后端是否运行**:
   ```bash
   curl http://localhost:4000/api/c/health
   ```

2. **检查环境变量配置**:
   - 确保 `.env` 文件存在且配置正确
   - Android 模拟器使用 `10.0.2.2` 而不是 `localhost`
   - 真机使用电脑的实际 IP 地址

3. **检查防火墙**:
   - 确保防火墙允许 4000 端口
   - 确保手机和电脑在同一网络

4. **重启 Metro Bundler**:
   ```bash
   npm start -- --reset-cache
   ```

### 5. 应用白屏或崩溃

**问题**: 应用启动后显示白屏或立即崩溃

**解决**:

1. **查看日志**:
   ```bash
   # Android
   adb logcat | grep ReactNativeJS
   
   # iOS (在 Xcode 中查看控制台)
   ```

2. **检查环境变量**:
   - 确保 `.env` 文件格式正确
   - 确保没有语法错误

3. **清除缓存重建**:
   ```bash
   # Android
   cd android
   ./gradlew clean
   cd ..
   npm start -- --reset-cache
   npm run android
   
   # iOS
   cd ios
   xcodebuild clean
   cd ..
   npm start -- --reset-cache
   npm run ios
   ```

### 6. TypeScript 类型错误

**问题**: `Cannot find module '@env'`

**解决**:
```bash
# 确保安装了 react-native-dotenv
npm install react-native-dotenv

# 重启 Metro Bundler
npm start -- --reset-cache
```

### 7. 端口被占用

**问题**: `Port 8081 already in use`

**解决**:
```bash
# 查找占用端口的进程
lsof -ti:8081

# 杀死进程（替换 PID）
kill -9 <PID>

# 或使用其他端口
npm start -- --port 8082
```

## 📱 模拟器启动

### Android 模拟器

**方式 1: 通过 Android Studio（推荐）**
1. 打开 Android Studio
2. 点击右上角的 **设备管理器** 图标
3. 点击 **▶️ Play** 按钮启动模拟器

**方式 2: 通过命令行**
```bash
# 列出所有模拟器
emulator -list-avds

# 启动指定模拟器
emulator -avd Pixel_5_API_33
```

**方式 3: 自动启动**
运行 `npm run android` 时，如果没有运行的设备，会自动启动模拟器。

**重要配置**：Android 模拟器需要使用 `10.0.2.2` 访问 localhost：
```env
API_BASE_URL=http://10.0.2.2:4000
```

### iOS 模拟器（仅 macOS）

**方式 1: 通过 Xcode**
1. 打开 Xcode
2. 菜单：`Xcode > Open Developer Tool > Simulator`
3. 菜单：`File > Open Simulator` 选择设备

**方式 2: 通过命令行**
```bash
# 列出所有设备
xcrun simctl list devices

# 启动指定设备
xcrun simctl boot "iPhone 14 Pro"
open -a Simulator
```

**方式 3: 自动启动**
运行 `npm run ios` 时，如果没有运行的设备，会自动启动模拟器。

**重要配置**：iOS 模拟器可以使用 `localhost`：
```env
API_BASE_URL=http://localhost:4000
```

**详细说明**：请参考 [EMULATOR_GUIDE.md](./EMULATOR_GUIDE.md) 获取完整的模拟器启动指南。

## 📱 真机调试

### Android 真机

1. **启用开发者选项**:
   - 设置 > 关于手机 > 连续点击"版本号"7次

2. **启用 USB 调试**:
   - 设置 > 开发者选项 > USB 调试

3. **连接设备**:
   ```bash
   adb devices
   # 应该显示您的设备
   ```

4. **运行应用**:
   ```bash
   npm run android
   ```

### iOS 真机

1. **在 Xcode 中**:
   - 选择您的设备作为运行目标
   - 配置开发者证书和 Provisioning Profile

2. **运行应用**:
   ```bash
   npm run ios
   ```

## 🎯 下一步

启动成功后，您可以：

1. **测试登录功能**: 使用注册的账户登录
2. **测试传单查询**: 搜索传单详情
3. **测试加油站查询**: 输入邮编查询附近加油站
4. **测试邮编管理**: 添加和管理常用邮编

## 📚 更多资源

- [React Native 官方文档](https://reactnative.dev/)
- [React Navigation 文档](https://reactnavigation.org/)
- [项目 README](./README.md)
- [API 集成文档](./API_INTEGRATION.md)

## 💡 提示

- 开发时保持 Metro Bundler 运行
- 修改代码后，应用会自动重新加载（Fast Refresh）
- 使用 `Cmd+D` (iOS) 或 `Cmd+M` (Android) 打开开发者菜单
- 使用 `Cmd+R` 手动重新加载应用


