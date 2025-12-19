# iOS 真机部署 - 最简单方法

对于 Expo 项目，部署到 iPhone 真机最简单的方法：

## 一键部署（推荐）

### 前提条件
1. ✅ iPhone 已通过 USB 连接到 Mac
2. ✅ 在 iPhone 上信任此电脑（如果提示）
3. ✅ iPhone 已解锁

### 执行命令

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 方法 1：使用 npm 脚本（最简单）
npm run ios -- --device

# 或者直接使用 Expo CLI
npx expo run:ios --device
```

**这个命令会自动：**
- ✅ 检查并安装依赖（如果需要）
- ✅ 预构建 iOS 项目（如果不存在）
- ✅ 安装 CocoaPods 依赖
- ✅ 构建应用
- ✅ 安装到连接的 iPhone

### 首次使用：配置代码签名

首次运行时，Expo 会提示选择设备，然后可能会打开 Xcode 进行代码签名配置：

1. 在 Xcode 中，选择项目 > Target > Signing & Capabilities
2. 勾选 "Automatically manage signing"
3. 选择你的 Team（Apple ID）
4. 如果没有账号，点击 "Add Account..." 登录

配置完成后，再次运行 `npm run ios -- --device` 即可。

### 在 iPhone 上信任开发者证书

应用安装后，首次打开需要信任证书：

1. **设置 > 通用 > VPN与设备管理**（或 **设备管理**）
2. 找到你的开发者证书
3. 点击进入，然后点击 **"信任"**
4. 确认信任
5. 返回主屏幕，打开应用

---

## 如果遇到问题

### 问题：设备未检测到

确保：
- iPhone 已连接并解锁
- 已在 iPhone 上信任此电脑
- USB 数据线正常

检查设备：
```bash
xcrun xctrace list devices
```

### 问题：需要手动选择设备

如果连接了多个设备，Expo 会显示列表让你选择。

### 问题：签名错误

1. 打开 Xcode：`open ios/*.xcworkspace`
2. 配置 Signing & Capabilities
3. 选择你的 Team
4. 重新运行 `npm run ios -- --device`

---

## 完整命令参考

```bash
# 部署到连接的设备
npm run ios -- --device

# 部署到特定设备（如果有多个）
npm run ios -- --device --udid <设备UDID>

# 清理后重新构建
npm run ios -- --device --clean

# 查看帮助
npx expo run:ios --help
```

---

## 后续更新

代码更新后，直接运行：
```bash
npm run ios -- --device
```

Expo 会自动重新构建并安装到 iPhone。

