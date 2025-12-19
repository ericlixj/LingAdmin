# 修复 localhost baseURL 问题

## 问题原因

当前 baseURL 显示为 `localhost:4000` 的原因：

1. **没有 `.env` 文件**，所以 `API_BASE_URL` 环境变量未定义
2. **代码逻辑**在开发模式下（`__DEV__ = true`）默认返回 `localhost:4000`

代码逻辑（`src/config/api.ts`）：
```typescript
const getDefaultBaseURL = () => {
  if (API_BASE_URL) {
    return API_BASE_URL;  // 优先使用环境变量
  }
  
  if (__DEV__) {
    // 开发模式下默认返回 localhost
    return 'http://localhost:4000';
  }
  
  // 生产环境
  return 'https://c-api.kxf.ca';
};
```

## 解决方案

### 方案 1：创建 .env 文件（推荐）

我已经为你创建了 `.env` 文件，设置为 production API：

```env
API_BASE_URL=https://c-api.kxf.ca
API_TIMEOUT=30000
NODE_ENV=production
```

### 方案 2：在应用中切换环境

如果应用已经运行，可以在应用中切换环境：

1. 打开应用首页
2. 找到"环境配置"区域
3. 点击"生产环境"按钮
4. 应用会自动切换到 production API

### 方案 3：清除应用缓存并重启

如果修改了 .env 文件，需要：

1. **清除 Metro 缓存并重启**：
   ```bash
   npm run start:clear
   ```

2. **如果使用原生构建，需要重新构建**：
   ```bash
   # 清除构建缓存
   cd ios
   xcodebuild clean
   cd ..
   
   # 重新构建
   npm run ios
   ```

## 验证

修改后，可以通过以下方式验证：

1. **查看终端日志**：
   - 应该看到 `✅ [API Service] Initialized with base URL: https://c-api.kxf.ca`
   - 或者 `🔄 [API Config] Using environment: production https://c-api.kxf.ca`

2. **在应用中查看**：
   - 首页的"环境配置"区域应该显示"生产环境"
   - API 地址应该显示 `https://c-api.kxf.ca`

3. **检查网络请求**：
   - 执行任何 API 调用
   - 网络请求应该发送到 `https://c-api.kxf.ca`

## 注意事项

- `.env` 文件不会被提交到 Git（已在 .gitignore 中）
- 修改 `.env` 后需要**清除缓存**并重新启动应用
- 环境变量是在编译时加载的，所以需要重新构建才能生效

## 如果仍然显示 localhost

如果修改后仍然显示 localhost，尝试：

1. **完全清理并重启**：
   ```bash
   # 停止 Metro bundler
   # 清除缓存
   rm -rf node_modules/.cache
   npm run start:clear
   
   # 在另一个终端重新构建
   npm run ios
   ```

2. **检查 .env 文件内容**：
   ```bash
   cat .env
   ```
   确保 API_BASE_URL 正确设置

3. **检查是否有其他 .env 文件覆盖**：
   ```bash
   ls -la .env*
   ```

