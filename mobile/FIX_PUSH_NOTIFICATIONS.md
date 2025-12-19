# 修复推送通知问题

## 问题

错误信息：
```
Cannot create a iOS App Development provisioning profile for "com.lingadmin.mobile".
Personal development teams, including "Gang Li", do not support the Push Notifications capability.
```

**原因**：个人开发者账号（免费 Apple ID）不支持 Push Notifications（推送通知）功能。

## 解决方案

我已经修改了 `ios/Ling/Ling.entitlements` 文件，移除了推送通知配置。

### 方法 1：在 Xcode 中手动移除（推荐）

如果你已经在 Xcode 中打开了项目：

1. 在 Xcode 中，点击项目名称（左侧导航器）
2. 选择 **TARGETS** > **Ling**（或你的应用名称）
3. 点击 **"Signing & Capabilities"** 标签
4. 找到 **"Push Notifications"** capability
5. 点击左上角的 **"-"** 按钮移除它

### 方法 2：如果已修改 entitlements 文件

如果已经移除了 entitlements 文件中的 `aps-environment`，需要：

1. 在 Xcode 中清理项目：**Product > Clean Build Folder**（或按 `Cmd + Shift + K`）
2. 重新尝试构建

### 方法 3：完全禁用推送通知

如果应用不需要推送通知，可以：

1. 在 Xcode 中移除 Push Notifications capability
2. 确保 `Ling.entitlements` 文件不包含 `aps-environment`

## 重新构建

修改后，重新运行：

```bash
npm run ios -- --device
```

## 如果应用需要推送通知

如果应用确实需要推送通知功能，你需要：

1. **升级到付费 Apple Developer 账号**（$99/年）
   - 访问：https://developer.apple.com/programs/
   - 注册并付费后，就可以使用推送通知功能

2. **或者使用 EAS Build**：
   - EAS Build 可能可以用付费账号构建，即使你的本地账号是免费的

## 当前状态

我已经修改了 `ios/Ling/Ling.entitlements` 文件，移除了 `aps-environment` 配置。

现在可以：
1. 在 Xcode 中确认 Push Notifications capability 已移除
2. 重新尝试构建和部署

