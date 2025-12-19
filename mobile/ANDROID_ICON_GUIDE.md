# Android 应用图标设置指南

本指南说明如何为 Android 应用设置图标和应用名称。

## 应用名称

应用名称已在 `app.config.js` 中设置为 **"Ling"**。

```javascript
expo: {
  name: 'Ling',
  // ...
}
```

这个名称会显示在：
- 应用启动器（主屏幕）
- 应用列表
- 设置中的应用信息

## Android 图标配置

### 当前配置

Android 使用**自适应图标**（Adaptive Icon），配置在 `app.config.js` 中：

```javascript
android: {
  adaptiveIcon: {
    foregroundImage: './assets/adaptive-icon.png',  // 前景图标
    backgroundColor: '#ffffff',                     // 背景颜色
  },
}
```

### 图标文件要求

#### 1. 主图标（icon.png）
- **位置**：`./assets/icon.png`
- **尺寸**：1024x1024 像素
- **格式**：PNG（透明背景）
- **用途**：iOS 和通用图标

#### 2. 自适应图标前景（adaptive-icon.png）
- **位置**：`./assets/adaptive-icon.png`
- **尺寸**：1024x1024 像素
- **格式**：PNG（透明背景）
- **要求**：
  - 图标内容应该在中心区域（约 66% 的区域）
  - 边缘留出安全区域（不会被裁剪）
  - 透明背景

#### 3. 背景颜色
- 在 `app.config.js` 中配置 `backgroundColor`
- 当前设置为 `#ffffff`（白色）
- 可以修改为任何颜色代码

### 图标设计建议

1. **安全区域**：
   - 将重要内容放在中心 66% 的区域
   - 边缘 17% 的区域可能被裁剪（不同设备形状不同）

2. **背景颜色**：
   - 选择与应用主题一致的颜色
   - 确保前景图标在背景上清晰可见

3. **图标内容**：
   - 简洁明了
   - 在小尺寸下也能识别
   - 避免过多细节

## 如何更新图标

### 方法 1：替换现有文件

1. **准备图标文件**：
   - 创建 1024x1024 像素的 PNG 图标
   - 确保是透明背景
   - 保存为 `adaptive-icon.png`

2. **替换文件**：
   ```bash
   # 将新图标复制到 assets 目录
   cp your-new-icon.png mobile/assets/adaptive-icon.png
   ```

3. **更新背景颜色**（可选）：
   在 `app.config.js` 中修改：
   ```javascript
   android: {
     adaptiveIcon: {
       foregroundImage: './assets/adaptive-icon.png',
       backgroundColor: '#YOUR_COLOR',  // 修改这里
     },
   }
   ```

4. **重新构建应用**：
   ```bash
   # 清除缓存并重新构建
   npm run android:rebuild
   ```

### 方法 2：使用在线工具生成

可以使用在线工具生成自适应图标：

1. **Android Asset Studio**：
   - https://romannurik.github.io/AndroidAssetStudio/icons-adaptive.html
   - 上传图标，自动生成各种尺寸

2. **App Icon Generator**：
   - https://www.appicon.co/
   - 上传一张图标，生成所有平台所需尺寸

### 方法 3：使用 Expo 工具

Expo 提供了图标生成工具：

```bash
# 安装工具
npm install -g @expo/configure-splash-screen

# 使用 expo-cli 生成图标（如果可用）
npx expo install expo-asset
```

## 图标文件结构

```
mobile/
├── assets/
│   ├── icon.png              # 主图标（1024x1024）
│   ├── adaptive-icon.png     # Android 自适应图标前景（1024x1024）
│   ├── splash.png           # 启动画面
│   └── favicon.png          # Web favicon
└── app.config.js            # 配置文件
```

## 验证图标

### 1. 本地预览

```bash
# 启动开发服务器
npm start

# 在 Android 模拟器或设备上查看
npm run android
```

### 2. 构建后查看

```bash
# 构建应用
npm run android:native

# 安装到设备查看实际效果
```

## 常见问题

### Q1: 图标显示不正确

**可能原因**：
- 文件路径错误
- 图标尺寸不正确
- 缓存问题

**解决方案**：
```bash
# 清除缓存并重新构建
npm run android:rebuild
```

### Q2: 图标被裁剪

**原因**：图标内容太靠近边缘

**解决方案**：
- 将重要内容放在中心 66% 区域
- 边缘留出安全区域

### Q3: 背景颜色不匹配

**解决方案**：
在 `app.config.js` 中修改 `backgroundColor`：
```javascript
android: {
  adaptiveIcon: {
    backgroundColor: '#YOUR_COLOR',  // 使用十六进制颜色代码
  },
}
```

### Q4: 如何同时更新 iOS 图标？

iOS 使用 `icon.png`：
```javascript
icon: './assets/icon.png',
```

更新 `assets/icon.png` 文件即可。

## 快速检查清单

- [ ] `adaptive-icon.png` 存在且为 1024x1024 像素
- [ ] 图标有透明背景
- [ ] 重要内容在中心 66% 区域
- [ ] `app.config.js` 中路径正确
- [ ] 背景颜色已设置
- [ ] 应用名称已更新为 "Ling"
- [ ] 已重新构建应用

## 当前配置总结

- **应用名称**：Ling
- **图标文件**：`./assets/adaptive-icon.png`
- **背景颜色**：`#ffffff`（白色）
- **包名**：`com.lingadmin.mobile`

## 下一步

1. ✅ 准备 1024x1024 像素的图标文件
2. ✅ 替换 `assets/adaptive-icon.png`
3. ✅ 根据需要调整背景颜色
4. ✅ 重新构建应用查看效果

## 相关资源

- [Android 自适应图标指南](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Expo 图标配置](https://docs.expo.dev/guides/app-icons/)
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

