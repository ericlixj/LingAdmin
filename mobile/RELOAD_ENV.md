# 重新加载环境变量配置

## 问题

修改 `.env` 文件后，模拟器中的配置还是旧的，因为环境变量是在编译时通过 Babel 插件加载的，需要清除缓存并重新编译。

## 解决方案

### 方法 1：使用清除缓存脚本（推荐）✅

```bash
cd mobile
./clear-cache-and-restart.sh
```

### 方法 2：手动清除缓存

#### 步骤 1：停止当前的 Metro bundler
在运行 Metro bundler 的终端中按 `Ctrl+C` 停止

#### 步骤 2：清除缓存并重启
```bash
cd mobile
npx expo start --clear
```

#### 步骤 3：重新加载应用
- 在模拟器中按 `r` 键重新加载
- 或者摇动设备打开开发菜单，选择 "Reload"
- 或者在 Metro bundler 终端中按 `r` 键

### 方法 3：完全清除（如果方法 2 不行）

```bash
cd mobile

# 1. 停止所有相关进程
# 在运行 Metro bundler 的终端按 Ctrl+C

# 2. 清除 Metro bundler 缓存
rm -rf node_modules/.cache
rm -rf .expo

# 3. 清除 watchman（如果安装了）
watchman watch-del-all 2>/dev/null || true

# 4. 重新启动
npx expo start --clear
```

### 方法 4：重新构建应用（最彻底）

```bash
cd mobile

# 1. 停止所有进程
# Ctrl+C 停止 Metro bundler

# 2. 清除所有缓存
rm -rf node_modules/.cache
rm -rf .expo
rm -rf android/app/build
rm -rf ios/build

# 3. 重新安装依赖（可选，通常不需要）
# npm install

# 4. 清除缓存并启动
npx expo start --clear

# 5. 重新运行 Android 应用
npm run android
```

## 验证配置已更新

### 1. 查看登录页面的调试信息

在开发模式下，登录页面顶部会显示：
```
🔧 调试信息
API: http://10.0.2.2:4000
超时: 30000ms
```

如果显示的是 `http://10.0.2.2:4000`，说明配置已更新。

### 2. 查看控制台日志

在 Metro bundler 终端中，查看网络请求日志：
```
🌐 [API Request] {
  baseURL: 'http://10.0.2.2:4000',
  ...
}
```

如果 `baseURL` 是 `http://10.0.2.2:4000`，说明配置已更新。

### 3. 测试登录

尝试登录，如果之前是网络错误，现在应该能正常连接。

## 为什么需要清除缓存？

1. **Babel 编译缓存**：环境变量通过 `babel-plugin-module-resolver` 和 `react-native-dotenv` 在编译时加载
2. **Metro bundler 缓存**：Metro 会缓存编译结果以提高性能
3. **应用缓存**：应用可能缓存了旧的配置

## 快速检查清单

- [ ] 已停止当前的 Metro bundler（Ctrl+C）
- [ ] 已运行 `npx expo start --clear`
- [ ] 已在模拟器中重新加载应用（按 `r` 键）
- [ ] 登录页面显示正确的 API 地址
- [ ] 控制台日志显示正确的 baseURL

## 常见问题

### Q: 清除缓存后还是显示旧的配置？

A: 尝试以下步骤：
1. 完全关闭模拟器
2. 运行 `npx expo start --clear`
3. 重新打开模拟器并运行应用

### Q: 如何确认 .env 文件已正确修改？

A: 运行以下命令查看：
```bash
cat mobile/.env
```

应该看到：
```
API_BASE_URL=http://10.0.2.2:4000
```

### Q: 修改 .env 后需要重启多少次？

A: 通常只需要：
1. 停止 Metro bundler
2. 运行 `npx expo start --clear`
3. 在模拟器中重新加载应用（按 `r`）

### Q: 可以热重载吗？

A: 环境变量是在编译时加载的，不能热重载。必须清除缓存并重新编译。

## 提示

- 每次修改 `.env` 文件后，都需要清除缓存并重启
- 建议使用 `npx expo start --clear` 而不是普通的 `npm start`
- 如果经常修改环境变量，可以使用 `./clear-cache-and-restart.sh` 脚本


