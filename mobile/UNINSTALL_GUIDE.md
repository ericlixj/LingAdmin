# 卸载应用指南

## 方法 1：使用卸载脚本（推荐）✅

```bash
cd mobile
npm run android:uninstall
```

或者直接运行：

```bash
cd mobile
./uninstall-app.sh
```

## 方法 2：使用 adb 命令

### 步骤 1：检查设备连接

```bash
# 确保 Android SDK 路径已设置
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 检查设备
adb devices
```

应该看到类似输出：
```
List of devices attached
emulator-5554   device
```

### 步骤 2：卸载应用

```bash
adb uninstall com.lingadmin.mobile
```

如果成功，会显示：
```
Success
```

## 方法 3：在模拟器中手动卸载

### Android 模拟器

1. **打开应用抽屉**
   - 在模拟器主屏幕，向上滑动或点击应用图标

2. **找到 LingAdmin 应用**
   - 在应用列表中查找 "LingAdmin"

3. **长按应用图标**
   - 长按应用图标，直到出现菜单

4. **选择卸载**
   - 点击"卸载"选项
   - 确认卸载

### 或者使用设置

1. **打开设置**
   - 在模拟器中打开"设置"应用

2. **进入应用管理**
   - 找到"应用"或"应用程序"选项
   - 点击进入

3. **找到 LingAdmin**
   - 在应用列表中找到 "LingAdmin"
   - 点击进入

4. **卸载应用**
   - 点击"卸载"按钮
   - 确认卸载

## 方法 4：使用 adb shell 命令

```bash
# 进入 adb shell
adb shell

# 卸载应用
pm uninstall com.lingadmin.mobile

# 退出 shell
exit
```

## 验证应用已卸载

### 方法 1：使用 adb

```bash
adb shell pm list packages | grep lingadmin
```

如果没有输出，说明应用已卸载。

### 方法 2：在模拟器中检查

在模拟器的应用抽屉中，应该找不到 LingAdmin 应用。

## 常见问题

### Q: 卸载失败，显示 "Failure [DELETE_FAILED_INTERNAL_ERROR]"

A: 尝试以下方法：

1. **强制停止应用**：
   ```bash
   adb shell am force-stop com.lingadmin.mobile
   ```

2. **再次尝试卸载**：
   ```bash
   adb uninstall com.lingadmin.mobile
   ```

3. **如果还是失败，使用强制卸载**：
   ```bash
   adb uninstall -k com.lingadmin.mobile
   ```
   注意：`-k` 参数会保留应用数据，但会卸载应用本身。

### Q: 找不到 adb 命令

A: 确保 Android SDK 路径已设置：

```bash
# WSL 环境
export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 或者使用完整路径
/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe uninstall com.lingadmin.mobile
```

### Q: 显示 "device offline"

A: 设备可能未正确连接：

1. 检查模拟器是否正在运行
2. 重启 adb：
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Q: 应用卸载后，数据还在吗？

A: 使用 `adb uninstall` 会删除应用及其所有数据。如果只想卸载应用但保留数据，可以使用：

```bash
adb uninstall -k com.lingadmin.mobile
```

但通常建议完全卸载，以便重新安装时使用新的配置。

## 卸载后重新安装

卸载应用后，可以重新安装：

```bash
# 方法 1：使用 Expo
npx expo start --clear
# 然后按 'a' 键安装到 Android 设备

# 方法 2：使用脚本
npm run android

# 方法 3：完全重建
npm run android:rebuild
```

## 提示

- 卸载应用会删除所有应用数据（登录信息、缓存等）
- 重新安装后需要重新登录
- 如果只是想清除缓存，可以只清除应用数据而不卸载：
  ```bash
  adb shell pm clear com.lingadmin.mobile
  ```

