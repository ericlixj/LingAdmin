# iOS 图标更新指南

## 配置已更新

✅ `app.config.js` 已更新为使用 `adaptive-icon.png` 作为 iOS 图标：

```javascript
expo: {
  icon: './assets/adaptive-icon.png',  // iOS 使用此图标
  // ...
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',  // Android 也使用此图标
      backgroundColor: '#ffffff',
    },
  },
}
```

## 应用更改

为了让 iOS 使用新的图标配置，需要重新生成 iOS 项目：

### 方法 1：使用脚本（推荐）

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile
./update-ios-icon.sh
```

### 方法 2：手动执行

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 删除现有 iOS 项目
rm -rf ios

# 重新预构建（会使用新的图标配置）
npx expo prebuild --platform ios
```

## 验证图标

重新生成后：

1. **在 Xcode 中检查**：
   ```bash
   open ios/*.xcworkspace
   ```
   - 打开 `ios/Ling/Images.xcassets/AppIcon.appiconset`
   - 确认图标文件已正确加载

2. **清理并构建**：
   - 在 Xcode 中：**Product > Clean Build Folder** (Cmd+Shift+K)
   - 然后：**Product > Build** (Cmd+B)

3. **运行到设备**：
   ```bash
   npm run ios -- --device
   ```

## 注意事项

- ⚠️ 重新生成 iOS 项目会覆盖所有手动修改的原生代码
- ✅ 应用配置、代码签名等需要在 Xcode 中重新配置
- ✅ 图标配置会在重新构建后生效

## 如果图标仍未显示

如果重新构建后图标仍未正确显示：

1. **检查图标文件**：
   - 确保 `assets/adaptive-icon.png` 存在
   - 确保尺寸是 1024x1024 像素
   - 确保格式是 PNG

2. **在 Xcode 中手动设置**：
   - 打开 `ios/Ling/Images.xcassets/AppIcon.appiconset`
   - 删除现有图标
   - 拖拽 `assets/adaptive-icon.png` 到 Xcode 的图标位置
   - 确保所有尺寸都已填充

3. **完全清理构建**：
   ```bash
   # 在 Xcode 中
   Product > Clean Build Folder (Cmd+Shift+K)
   
   # 或者在终端
   cd ios
   xcodebuild clean
   cd ..
   ```

