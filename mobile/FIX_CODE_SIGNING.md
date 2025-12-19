# 修复代码签名证书问题

当你看到错误：`No code signing certificates are available to use.`

这表示需要配置代码签名。按照以下步骤操作：

## 快速修复步骤

### 1. 确保 iOS 项目已生成

```bash
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 如果 ios 目录不存在，先预构建
if [ ! -d "ios" ]; then
    npx expo prebuild --platform ios
fi
```

### 2. 打开 Xcode 项目

```bash
# 打开 .xcworkspace（如果存在）
open ios/*.xcworkspace

# 或者查找项目文件
find ios -name "*.xcworkspace" -o -name "*.xcodeproj" | head -1 | xargs open
```

⚠️ **重要**：优先打开 `.xcworkspace` 文件，不是 `.xcodeproj`

### 3. 在 Xcode 中配置代码签名

#### 步骤 A：选择项目

1. 在 Xcode 左侧导航器中，点击最顶部的**蓝色项目图标**（项目名称）
2. 在中间面板，选择 **TARGETS** > **你的应用名称**（通常是项目名）

#### 步骤 B：配置 Signing & Capabilities

1. 点击顶部的 **"Signing & Capabilities"** 标签
2. ✅ **勾选 "Automatically manage signing"**（自动管理签名）

#### 步骤 C：选择 Team

1. 在 **Team** 下拉菜单中：
   - 如果看到你的 Apple ID，直接选择
   - 如果没有，点击 **"Add Account..."**
   
2. 登录你的 Apple ID：
   - 输入 Apple ID 邮箱和密码
   - 免费 Apple ID 也可以用于个人设备测试
   - 点击 "Sign In"

3. 登录后，回到 Team 下拉菜单，选择你的账号

#### 步骤 D：检查 Bundle Identifier

- Xcode 会自动生成 Bundle Identifier（如 `com.lingadmin.mobile`）
- 如果提示已存在，在后面添加后缀（如 `.dev` 或 `.personal`）
- 或者可以在 `app.config.js` 中修改：

```javascript
ios: {
  bundleIdentifier: 'com.yourname.lingadmin.mobile',
}
```

然后重新运行：`npx expo prebuild --platform ios`

### 4. 等待证书生成

- Xcode 会自动创建开发证书和配置文件
- 可能需要几分钟时间
- 如果看到错误，点击 **"Download Manual Profiles"**

### 5. 验证配置

- 确保 **Signing Certificate** 显示为 "Apple Development"
- 确保没有红色错误提示
- 如果有警告（黄色），通常可以忽略

### 6. 重新运行部署

配置完成后，回到终端运行：

```bash
npm run ios -- --device
```

或者：

```bash
npx expo run:ios --device
```

---

## 如果仍然有问题

### 问题 1：无法添加账号

**解决方案**：
1. 确保网络连接正常
2. 尝试在浏览器中登录 appleid.apple.com 确认账号正常
3. 如果账号需要两步验证，确保使用应用专用密码

### 问题 2：Team 显示为 "Personal Team"

这是正常的！免费 Apple ID 会显示为 "Personal Team"，可以正常使用。

### 问题 3：证书创建失败

**解决方案**：
1. 在 Xcode 中：**Preferences > Accounts**
2. 选择你的账号
3. 点击 **"Download Manual Profiles"**
4. 或者删除账号后重新添加

### 问题 4：Bundle Identifier 冲突

**解决方案**：

在 `app.config.js` 中修改：

```javascript
export default {
  expo: {
    // ...
    ios: {
      bundleIdentifier: 'com.yourname.lingadmin.mobile', // 改为唯一的标识符
    },
  },
};
```

然后重新构建：

```bash
rm -rf ios
npx expo prebuild --platform ios
```

### 问题 5：需要开发者账号？

**不需要！**免费 Apple ID 可以用于：
- ✅ 在自己的设备上测试
- ✅ 开发调试
- ✅ 个人使用

只有发布到 App Store 才需要付费开发者账号（$99/年）。

---

## 使用免费 Apple ID 的限制

- 证书有效期：**7 天**（过期后需要重新构建）
- 设备限制：最多 **3 台设备**
- 不能发布到 App Store

但这些对个人开发和测试完全够用！

---

## 完整流程总结

```bash
# 1. 进入项目目录
cd /Users/ericlixj/Documents/workspace-fullstack/LingAdmin/mobile

# 2. 预构建 iOS 项目（如果不存在）
npx expo prebuild --platform ios

# 3. 打开 Xcode
open ios/*.xcworkspace

# 4. 在 Xcode 中配置签名（见上述步骤）

# 5. 返回终端，运行部署
npm run ios -- --device
```

---

## 配置完成后

配置完成后，以后就可以直接运行：

```bash
npm run ios -- --device
```

Xcode 会记住你的配置，不需要每次都设置。

