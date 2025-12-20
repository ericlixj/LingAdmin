# 测试和构建工作流程

本指南说明如何在本地模拟器测试，然后使用 EAS Build 构建到云端。

## 工作流程概览

```
本地开发 → 模拟器测试 → 云端构建 → 真机测试/发布
```

## 阶段 1：本地模拟器测试

### 步骤 1：确保模拟器运行

```bash
# 检查设备连接
adb devices
```

应该显示类似：
```
List of devices attached
emulator-5554   device
```

如果没有设备，请：
1. 在 Windows 上启动 Android Studio
2. 启动 Android 模拟器

### 步骤 2：构建并安装到模拟器

```bash
cd mobile

# 构建并安装开发版本到模拟器
npm run android:native
```

**首次构建**：
- 需要 5-10 分钟
- 会自动预构建原生项目（如果需要）
- 构建完成后自动安装到模拟器

**后续构建**：
- 通常 2-5 分钟
- 增量构建，更快

### 步骤 3：启动开发服务器

```bash
# 在另一个终端窗口
npm start
```

或者使用一键命令（构建+启动）：
```bash
npm run android:dev
```

### 步骤 4：在模拟器中测试

1. 应用会自动安装到模拟器
2. 打开应用
3. 测试所有功能：
   - ✅ 登录功能
   - ✅ 传单详情搜索
   - ✅ 加油站查询
   - ✅ 邮编管理
   - ✅ 环境切换
   - ✅ API 连接

### 步骤 5：调试和修复

如果发现问题：
1. 修改代码
2. 保存文件
3. 应用会自动热重载（如果开发服务器正在运行）
4. 或者重新构建：`npm run android:native`

## 阶段 2：云端构建（EAS Build）

### 前置要求

1. **EAS 账号**：
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **项目配置**：
   - ✅ `eas.json` 已配置
   - ✅ `app.config.js` 已配置

### 构建选项

#### 选项 1：预览版本（推荐用于测试）

```bash
# 构建预览版本（用于内部测试）
eas build --platform android --profile preview
```

**特点**：
- ✅ 使用生产 API（`https://c-api.kxf.ca`）
- ✅ 接近生产环境
- ✅ 可以分发给测试人员
- ✅ 不需要 Google Play 账号

#### 选项 2：生产版本（用于发布）

```bash
# 构建生产版本（用于 Google Play）
eas build --platform android --profile production
```

**特点**：
- ✅ 使用生产 API
- ✅ 自动递增版本号
- ✅ 适合发布到 Google Play

#### 选项 3：开发版本（用于调试）

```bash
# 构建开发版本（用于调试）
eas build --platform android --profile development
```

**特点**：
- ✅ 支持热重载
- ✅ 使用开发 API（`http://10.0.2.2:4000`）
- ✅ 适合远程调试

### 构建流程

1. **启动构建**：
   ```bash
   eas build --platform android --profile preview
   ```

2. **等待构建完成**：
   - 通常需要 10-20 分钟
   - 可以在终端查看进度
   - 或在 EAS Dashboard 查看：https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds

3. **下载构建文件**：
   ```bash
   # 查看构建列表
   eas build:list --platform android
   
   # 下载 APK 文件
   eas build:download [BUILD_ID]
   ```

4. **安装到真机**：
   - 将 APK 文件传输到 Android 手机
   - 在手机上启用"未知来源"安装
   - 点击 APK 文件安装

## 完整工作流程示例

### 场景：开发新功能

```bash
# 1. 本地开发
cd mobile
npm start

# 2. 在模拟器测试
npm run android:native

# 3. 测试功能
# ... 在模拟器中测试 ...

# 4. 修复问题
# ... 修改代码 ...

# 5. 重新测试
npm run android:native

# 6. 确认无误后，云端构建
eas build --platform android --profile preview

# 7. 下载并安装到真机测试
eas build:download [BUILD_ID]

# 8. 真机测试通过后，构建生产版本
eas build --platform android --profile production
```

## 本地 vs 云端构建对比

| 特性 | 本地构建 | 云端构建 (EAS) |
|------|---------|---------------|
| 速度 | 快（2-10分钟） | 慢（10-20分钟） |
| 需要环境 | Android SDK, Gradle | 只需 EAS CLI |
| 适合场景 | 开发、调试 | 测试、发布 |
| 设备限制 | 需要本地设备 | 无限制 |
| 成本 | 免费 | 免费计划：30次/月 |

## 常用命令速查

### 本地开发

```bash
# 构建并安装到模拟器
npm run android:native

# 完全重建（清除缓存）
npm run android:rebuild

# 启动开发服务器
npm start

# 一键构建+启动
npm run android:dev

# 卸载应用
npm run android:uninstall
```

### 云端构建

```bash
# 构建预览版本
eas build --platform android --profile preview

# 构建生产版本
eas build --platform android --profile production

# 构建开发版本
eas build --platform android --profile development

# 查看构建列表
eas build:list --platform android

# 下载构建文件
eas build:download [BUILD_ID]

# 查看构建详情
eas build:view [BUILD_ID]
```

## 测试检查清单

### 本地模拟器测试

- [ ] 应用可以正常启动
- [ ] 登录功能正常
- [ ] API 连接正常（检查 API 地址）
- [ ] 所有功能页面正常
- [ ] 环境切换功能正常
- [ ] 应用名称显示为 "Ling"
- [ ] 图标显示正确
- [ ] 没有崩溃或错误

### 真机测试（云端构建后）

- [ ] 安装成功
- [ ] 应用启动正常
- [ ] 网络连接正常（注意 API 地址）
- [ ] 所有功能正常
- [ ] 性能表现良好
- [ ] 在不同 Android 版本上测试（如果可能）

## 当前配置

### 本地开发
- **API 地址**：`http://10.0.2.2:4000`（Android 模拟器）
- **构建方式**：`expo run:android`
- **应用名称**：Ling

### 预览构建
- **API 地址**：`https://c-api.kxf.ca`
- **构建方式**：EAS Build
- **分发方式**：内部（Ad Hoc）

### 生产构建
- **API 地址**：`https://c-api.kxf.ca`
- **构建方式**：EAS Build
- **分发方式**：Google Play

## 下一步

1. ✅ **现在**：在模拟器上测试
   ```bash
   npm run android:native
   ```

2. ✅ **测试完成后**：云端构建预览版本
   ```bash
   eas build --platform android --profile preview
   ```

3. ✅ **真机测试通过后**：构建生产版本
   ```bash
   eas build --platform android --profile production
   ```

## 相关文档

- [DEV_BUILD_FIX.md](./DEV_BUILD_FIX.md) - 开发构建问题解决
- [ANDROID_ICON_GUIDE.md](./ANDROID_ICON_GUIDE.md) - 图标设置指南
- [EAS Build 文档](https://docs.expo.dev/build/introduction/)



