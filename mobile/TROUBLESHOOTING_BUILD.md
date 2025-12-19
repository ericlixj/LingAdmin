# 构建问题排查指南

如果构建失败，请按照以下步骤排查：

## 快速检查清单

### 1. 检查 Android SDK

```bash
# 检查 ANDROID_HOME 环境变量
echo $ANDROID_HOME

# 如果未设置，检查默认路径
ls -la /mnt/c/Users/ericl/AppData/Local/Android/Sdk
```

**问题**：如果路径不存在或错误
**解决**：
- 确认 Android Studio 已安装
- 在 Android Studio 中查看 SDK 路径：`File > Settings > Appearance & Behavior > System Settings > Android SDK`
- 在 `~/.bashrc` 中设置：
  ```bash
  export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### 2. 检查 adb 工具

```bash
# 检查 adb 是否存在
ls -la $ANDROID_HOME/platform-tools/adb.exe

# 测试 adb
$ANDROID_HOME/platform-tools/adb.exe version
```

**问题**：adb 无法执行
**解决**：
- 确保 Android SDK Platform-Tools 已安装
- 在 Android Studio SDK Manager 中安装 Platform-Tools

### 3. 检查设备连接

```bash
# 检查连接的设备
$ANDROID_HOME/platform-tools/adb.exe devices
```

**问题**：没有设备
**解决**：
- 确保 Android 模拟器已启动
- 或连接物理设备并启用 USB 调试
- 在 Windows 上启动 Android Studio 和模拟器

### 4. 检查 Node.js 和 npm

```bash
node --version
npm --version
npx --version
```

**问题**：命令不存在
**解决**：
- 安装 Node.js（推荐 v18+）
- 确保 npm 已正确安装

### 5. 检查项目依赖

```bash
cd mobile
npm install
```

**问题**：依赖安装失败
**解决**：
- 清除 npm 缓存：`npm cache clean --force`
- 删除 `node_modules` 和 `package-lock.json`，重新安装

### 6. 检查 Gradle（如果预构建失败）

```bash
# 检查 android 目录是否存在
ls -la android/

# 如果存在，检查 Gradle
cd android
./gradlew --version
```

**问题**：Gradle 无法执行
**解决**：
- 确保 Java JDK 已安装（推荐 JDK 17）
- 设置 JAVA_HOME 环境变量

## 常见错误及解决方案

### 错误 1: "ANDROID_HOME is not set"

```bash
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

添加到 `~/.bashrc` 使其永久生效。

### 错误 2: "adb: command not found"

**解决**：
```bash
# 创建符号链接（WSL）
ln -sf "$ANDROID_HOME/platform-tools/adb.exe" "$ANDROID_HOME/platform-tools/adb"
```

### 错误 3: "No devices found"

**解决**：
1. 在 Windows 上启动 Android Studio
2. 启动 Android 模拟器
3. 等待模拟器完全启动
4. 再次运行 `adb devices`

### 错误 4: "expo prebuild failed"

**解决**：
```bash
# 清除缓存
rm -rf .expo
rm -rf android
rm -rf ios

# 重新预构建
npx expo prebuild --platform android --clean
```

### 错误 5: "Gradle build failed"

**解决**：
```bash
cd android
./gradlew clean
cd ..
npm run android:rebuild
```

### 错误 6: "Java version mismatch"

**解决**：
- 确保使用 JDK 17（推荐）
- 设置 JAVA_HOME：
  ```bash
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
  ```

## 完全重建步骤

如果所有方法都失败，尝试完全重建：

```bash
cd mobile

# 1. 清除所有缓存和构建文件
rm -rf .expo
rm -rf android
rm -rf ios
rm -rf node_modules/.cache

# 2. 重新安装依赖
npm install

# 3. 清除 Metro 缓存
npm start -- --clear

# 4. 在另一个终端，重新构建
npm run android:rebuild
```

## 获取详细错误信息

如果构建失败，运行：

```bash
# 详细模式构建
npx expo run:android --verbose

# 或查看 Gradle 日志
cd android
./gradlew assembleDebug --stacktrace
```

## 检查清单

在报告问题前，请确认：

- [ ] Android SDK 已安装且路径正确
- [ ] ANDROID_HOME 环境变量已设置
- [ ] adb 工具可用
- [ ] Android 模拟器已启动
- [ ] Node.js 和 npm 已安装
- [ ] 项目依赖已安装（`npm install`）
- [ ] Java JDK 已安装（JDK 17 推荐）

## 获取帮助

如果问题仍然存在，请提供：

1. **错误信息**：完整的错误输出
2. **环境信息**：
   ```bash
   echo "ANDROID_HOME: $ANDROID_HOME"
   echo "Node: $(node --version)"
   echo "npm: $(npm --version)"
   $ANDROID_HOME/platform-tools/adb.exe version
   ```
3. **构建命令**：您运行的完整命令
4. **构建日志**：如果有详细的构建日志

## 替代方案

如果本地构建一直失败，可以考虑：

1. **使用 EAS Build（云端构建）**：
   ```bash
   eas build --platform android --profile development --local
   ```

2. **使用 Expo Go（如果项目支持）**：
   ```bash
   # 移除 expo-dev-client
   npm uninstall expo-dev-client
   npm start
   ```

