# 网络调试指南

## 概述

已添加详细的网络请求调试功能，帮助您快速定位和解决网络连接问题。

## 调试功能

### 1. 控制台日志

在开发模式下，所有网络请求都会在控制台输出详细信息：

- **🌐 [API Request]** - 请求信息（方法、URL、参数、请求体）
- **✅ [API Response]** - 成功响应（状态码、响应数据）
- **❌ [API Network Error]** - 网络错误（连接失败、超时等）
- **❌ [API Response Error]** - 服务器错误响应（状态码、错误信息）

### 2. 登录页面调试信息

在开发模式下，登录页面会显示：
- 当前 API 地址
- API 超时设置

### 3. 增强的错误提示

登录失败时会显示详细的错误信息，包括：
- 错误类型（网络错误、服务器错误等）
- 当前使用的 API 地址
- 故障排查建议

## 如何查看调试信息

### 方法 1：查看 Metro 控制台

运行应用时，在终端中查看 Metro bundler 的输出：

```bash
npm start
# 或
npx expo start
```

所有网络请求的日志都会显示在这里。

### 2. 方法 2：查看 React Native Debugger

如果使用 React Native Debugger 或 Chrome DevTools，可以在 Console 标签页查看日志。

### 方法 3：查看登录页面

在开发模式下，登录页面顶部会显示当前的 API 配置信息。

## 常见网络错误及解决方案

### 1. ECONNREFUSED / ENOTFOUND

**错误信息**：无法连接到服务器

**可能原因**：
- API 地址配置错误
- 后端服务未运行
- 网络连接问题

**解决方案**：
1. 检查 `.env` 文件中的 `API_BASE_URL` 配置
2. 确认后端服务正在运行
3. 根据运行环境选择正确的 API 地址：
   - **Android 模拟器**：`http://10.0.2.2:4000`
   - **iOS 模拟器**：`http://localhost:4000`
   - **真机（同一网络）**：`http://192.168.x.x:4000`（替换为您的电脑 IP）

### 2. ECONNABORTED

**错误信息**：请求超时

**可能原因**：
- 网络连接慢
- 服务器响应慢
- 超时设置过短

**解决方案**：
1. 检查网络连接
2. 增加超时时间（在 `.env` 中设置 `API_TIMEOUT`）
3. 检查服务器是否正常运行

### 3. 404 Not Found

**错误信息**：请求的资源不存在

**可能原因**：
- API 端点路径错误
- 后端路由配置问题

**解决方案**：
1. 检查 API 端点配置（`src/config/api.ts`）
2. 确认后端 API 路由正确

### 4. 401 Unauthorized

**错误信息**：未授权

**可能原因**：
- Token 过期或无效
- 未登录

**解决方案**：
1. 重新登录
2. 检查 Token 是否正确保存

## 配置 API 地址

### 1. 编辑 `.env` 文件

```bash
cd mobile
nano .env
```

### 2. 根据运行环境设置

**Android 模拟器**：
```env
API_BASE_URL=http://10.0.2.2:4000
```

**iOS 模拟器**：
```env
API_BASE_URL=http://localhost:4000
```

**真机（同一 WiFi）**：
```env
API_BASE_URL=http://192.168.1.100:4000
```
（将 `192.168.1.100` 替换为您的电脑 IP 地址）

**生产环境**：
```env
API_BASE_URL=https://api.yourdomain.com
```

### 3. 重启应用

修改 `.env` 文件后，需要重启 Metro bundler：

```bash
# 停止当前进程 (Ctrl+C)
# 然后重新启动
npm start
```

## 测试 API 连接

### 1. 使用 curl 测试

在终端中测试 API 是否可访问：

```bash
# 测试健康检查端点
curl http://localhost:4000/api/c/health

# 测试登录端点（需要替换为实际的 API 地址）
curl -X POST http://localhost:4000/api/c/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. 查看网络请求日志

在应用运行时，查看控制台输出，确认：
- 请求 URL 是否正确
- 请求参数是否正确
- 服务器响应是什么

## 调试步骤

当遇到网络错误时，按以下步骤排查：

1. **查看控制台日志**
   - 找到 `🌐 [API Request]` 日志，确认请求 URL
   - 找到 `❌ [API Network Error]` 或 `❌ [API Response Error]` 日志

2. **检查 API 配置**
   - 查看登录页面显示的 API 地址
   - 确认 `.env` 文件中的配置

3. **测试后端服务**
   - 使用 curl 或 Postman 测试 API
   - 确认后端服务正常运行

4. **检查网络连接**
   - Android 模拟器需要使用 `10.0.2.2`
   - iOS 模拟器可以使用 `localhost`
   - 真机需要使用电脑的 IP 地址

5. **查看详细错误信息**
   - 登录失败时会显示详细的错误信息
   - 根据错误类型采取相应的解决方案

## 示例：调试登录错误

假设登录时出现 "network error"：

1. **查看控制台**，找到类似这样的日志：
   ```
   ❌ [API Network Error] {
     message: '网络错误：无法连接到服务器',
     code: 'ECONNREFUSED',
     url: '/api/c/auth/login',
     baseURL: 'http://localhost:4000',
     fullURL: 'http://localhost:4000/api/c/auth/login'
   }
   ```

2. **分析问题**：
   - 如果使用的是 Android 模拟器，`localhost` 不会工作
   - 需要改为 `http://10.0.2.2:4000`

3. **修改配置**：
   ```bash
   # 编辑 .env 文件
   API_BASE_URL=http://10.0.2.2:4000
   ```

4. **重启应用**并重试

## 注意事项

- 调试日志只在开发模式（`__DEV__ = true`）下显示
- 生产环境不会显示详细的错误信息
- 修改 `.env` 文件后需要重启 Metro bundler
- Android 模拟器必须使用 `10.0.2.2` 而不是 `localhost`

## 获取帮助

如果问题仍然存在：

1. 查看完整的控制台日志
2. 检查后端服务日志
3. 使用 curl 或 Postman 测试 API
4. 确认网络配置和防火墙设置

