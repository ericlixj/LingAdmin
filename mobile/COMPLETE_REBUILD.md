# 完全重新构建应用指南

## 问题

应用仍然显示旧的配置（如 `localhost:4000` 而不是 `10.0.2.2:4000`），即使已经修改了 `.env` 文件。

## 原因

环境变量通过 Babel 插件在编译时加载，Babel 和 Metro bundler 都会缓存编译结果。需要完全清除所有缓存并重新构建。

## 解决方案

### 方法 1：使用重建脚本（推荐）✅

```bash
cd mobile
npm run android:rebuild
```

这个脚本会：
1. 停止所有相关进程
2. 清除所有缓存（Metro、Babel、Expo、Watchman）
3. 卸载旧应用
4. 重新启动并安装应用

### 方法 2：手动完全重建

#### 步骤 1：停止所有进程

```bash
# 在运行 Metro bundler 的终端按 Ctrl+C
# 确保所有相关进程都已停止
```

#### 步骤 2：清除所有缓存

```bash
cd mobile

# 清除 Metro bundler 缓存
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared

# 清除 Babel 缓存（重要！）
rm -rf node_modules/.cache/babel-loader

# 清除 Watchman 缓存（如果安装了）
watchman watch-del-all 2>/dev/null || true

# 清除 Android 构建缓存（如果存在）
rm -rf android/app/build
rm -rf android/build
```

#### 步骤 3：卸载旧应用

在 Android 模拟器中：
1. 长按应用图标
2. 选择"卸载"
3. 或者使用 adb：
   ```bash
   adb uninstall com.lingadmin.mobile
   ```

#### 步骤 4：验证 .env 文件

```bash
cat .env | grep API_BASE_URL
```

应该显示：
```
API_BASE_URL=http://10.0.2.2:4000
```

#### 步骤 5：重新启动（清除缓存模式）

```bash
npx expo start --clear
```

#### 步骤 6：重新安装应用

在 Metro bundler 启动后：
- 按 `a` 键在 Android 模拟器中安装并运行
- 或者运行：`npm run android`

### 方法 3：最彻底的清理（如果上面都不行）

```bash
cd mobile

# 1. 停止所有进程
pkill -f "expo" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true

# 2. 清除所有缓存和构建文件
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared
rm -rf android/app/build
rm -rf android/build
rm -rf ios/build

# 3. 清除 Babel 缓存
find node_modules -name ".babel-cache" -type d -exec rm -rf {} + 2>/dev/null || true

# 4. 重新安装依赖（可选，通常不需要）
# npm install

# 5. 卸载应用
adb uninstall com.lingadmin.mobile 2>/dev/null || true

# 6. 重新启动
npx expo start --clear --android
```

## 验证配置已更新

重建后，检查以下内容：

### 1. 登录页面调试信息

应该显示：
```
🔧 调试信息
API: http://10.0.2.2:4000
超时: 30000ms
```

**不是** `http://localhost:4000`！

### 2. 控制台日志

在 Metro bundler 终端中，查看网络请求：
```
🌐 [API Request] {
  baseURL: 'http://10.0.2.2:4000',
  ...
}
```

### 3. 测试登录

尝试登录，应该能正常连接到后端服务。

## 已完成的改进

1. ✅ **更新了 Babel 配置**：禁用了缓存（`api.cache(false)`），确保环境变量更改能立即生效
2. ✅ **创建了重建脚本**：`rebuild-android.sh`
3. ✅ **添加了 npm 脚本**：`npm run android:rebuild`

## 为什么需要完全重建？

1. **Babel 缓存**：环境变量在编译时通过 Babel 插件加载，Babel 会缓存编译结果
2. **Metro bundler 缓存**：Metro 会缓存 JavaScript bundle
3. **应用缓存**：已安装的应用可能缓存了旧的配置
4. **原生构建缓存**：Android 构建系统也会缓存

## 常见问题

### Q: 为什么修改了 .env 文件，应用还是显示旧的配置？

A: 因为环境变量是在编译时加载的，需要：
1. 清除 Babel 缓存
2. 清除 Metro bundler 缓存
3. 重新编译应用
4. 重新安装应用

### Q: 每次修改 .env 都需要完全重建吗？

A: 是的，因为环境变量在编译时加载。但我们已经禁用了 Babel 缓存，所以现在只需要：
1. 停止 Metro bundler
2. 运行 `npx expo start --clear`
3. 重新加载应用（按 `r` 键）

### Q: 如何确认 Babel 缓存已清除？

A: 检查以下目录是否已删除：
```bash
ls -la node_modules/.cache/babel-loader
# 应该显示 "No such file or directory"
```

### Q: 重建后还是显示旧配置怎么办？

A: 尝试以下步骤：
1. 确认 `.env` 文件内容正确：`cat .env | grep API_BASE_URL`
2. 确认文件路径正确（应该在 `mobile/.env`）
3. 检查是否有多个 `.env` 文件
4. 完全删除 `node_modules/.cache` 目录
5. 重新安装依赖：`npm install`

## 快速检查清单

- [ ] 已停止所有 Metro bundler 进程
- [ ] 已清除 `node_modules/.cache`
- [ ] 已清除 `.expo` 目录
- [ ] 已清除 Babel 缓存
- [ ] 已卸载旧应用
- [ ] `.env` 文件显示 `API_BASE_URL=http://10.0.2.2:4000`
- [ ] 已运行 `npx expo start --clear`
- [ ] 已重新安装应用
- [ ] 登录页面显示 `API: http://10.0.2.2:4000`

## 提示

- 使用 `npm run android:rebuild` 可以一键完成所有步骤
- 如果经常修改环境变量，建议保持 Babel 缓存禁用（已配置）
- 生产环境构建时，可以重新启用 Babel 缓存以提高性能


