# 快速开始指南

## 🚀 本地模拟器测试（第一步）

### 1. 启动模拟器
确保 Android 模拟器正在运行。

### 2. 构建并安装
```bash
cd mobile
npm run android:native
```

**首次构建需要 5-10 分钟**，请耐心等待。

### 3. 启动开发服务器
```bash
npm start
```

### 4. 测试应用
在模拟器中打开应用，测试所有功能。

---

## ☁️ 云端构建（测试通过后）

### 1. 登录 EAS（如果还没登录）
```bash
npm install -g eas-cli
eas login
```

### 2. 构建预览版本
```bash
npm run android:build:preview
```

或直接使用：
```bash
eas build --platform android --profile preview
```

### 3. 等待构建完成
- 通常需要 10-20 分钟
- 可以在终端查看进度
- 或在 [EAS Dashboard](https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds) 查看

### 4. 下载并安装到真机
```bash
# 查看构建列表
eas build:list --platform android

# 下载 APK
eas build:download [BUILD_ID]
```

然后将 APK 文件传输到手机并安装。

---

## 📋 完整工作流程

```
1. 本地开发 → npm run android:native
2. 模拟器测试 → 验证功能
3. 云端构建 → npm run android:build:preview
4. 真机测试 → 下载 APK 安装
5. 生产构建 → npm run android:build:production
```

---

## 🛠️ 常用命令

### 本地开发
```bash
npm run android:native      # 构建并安装到模拟器
npm run android:rebuild     # 完全重建
npm start                   # 启动开发服务器
npm run android:dev         # 一键构建+启动
```

### 云端构建
```bash
npm run android:build:preview      # 预览版本
npm run android:build:production   # 生产版本
npm run android:build:dev          # 开发版本
```

### 查看和管理
```bash
eas build:list --platform android  # 查看构建列表
eas build:download [BUILD_ID]     # 下载构建文件
eas build:view [BUILD_ID]          # 查看构建详情
```

---

## ⚠️ 注意事项

1. **首次构建**：本地和云端都需要较长时间
2. **API 地址**：
   - 本地开发：`http://10.0.2.2:4000`
   - 预览/生产：`https://c-api.kxf.ca`
3. **应用名称**：已设置为 "Ling"
4. **图标**：使用 `assets/adaptive-icon.png`

---

## 📚 详细文档

- [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md) - 完整测试工作流程
- [DEV_BUILD_FIX.md](./DEV_BUILD_FIX.md) - 开发构建问题解决
- [ANDROID_ICON_GUIDE.md](./ANDROID_ICON_GUIDE.md) - 图标设置指南

