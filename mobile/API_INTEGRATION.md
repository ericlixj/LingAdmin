# API 集成说明

## 后端服务

移动应用完全复用 `capp/backend` 服务，无需额外后端配置。

### capp/backend 提供的 API

所有 API 端点前缀为 `/api/c/`：

#### 1. 认证相关 (`/api/c/auth/*`)

- `POST /api/c/auth/register` - 用户注册
- `POST /api/c/auth/login` - 用户登录
- `GET /api/c/auth/me` - 获取当前用户信息
- `GET /api/c/auth/verify-email?token=xxx` - 验证邮箱

#### 2. 传单详情 (`/api/c/flyer_details`)

- `GET /api/c/flyer_details` - 搜索传单详情
  - 参数：
    - `q` - 搜索关键词
    - `lang` - 语言 (cn/en/hk)
    - `zip_code` - 邮编筛选
    - `_start` - 起始位置
    - `_end` - 结束位置

#### 3. 加油站查询 (`/api/c/gas`)

- `GET /api/c/gas` - 查询加油站
  - 参数：
    - `postcode` - 邮编（必需）
    - `maxDistance` - 最大距离（km，默认 5）

#### 4. 邮编管理 (`/api/c/postcode`)

- `GET /api/c/postcode` - 获取用户的所有邮编
- `POST /api/c/postcode` - 创建邮编
- `PATCH /api/c/postcode/:id` - 更新邮编
- `DELETE /api/c/postcode/:id` - 删除邮编

### 认证机制

所有需要认证的 API 使用 JWT Bearer Token：

```
Authorization: Bearer <access_token>
```

Token 在登录成功后返回，存储在 AsyncStorage 中，API 服务会自动添加到请求头。

### 响应格式

所有 API 响应统一格式：

```json
{
  "code": 0,           // 0 表示成功，非 0 表示错误
  "message": "ok",     // 消息
  "data": {}           // 数据
}
```

### 错误处理

- `code: 0` - 成功
- `code: 1` - 业务错误（如：邮箱已存在、密码错误等）
- HTTP 状态码：
  - `200` - 成功
  - `400` - 请求参数错误
  - `401` - 未授权（Token 无效或过期）
  - `403` - 禁止访问（如：账户未激活）
  - `404` - 资源不存在
  - `500` - 服务器错误

## 配置说明

### 开发环境

1. **确保 capp/backend 正在运行**：
   ```bash
   # 如果使用 Docker
   docker-compose up capp-backend
   
   # 或者直接运行
   cd capp/backend
   npm start
   ```

2. **配置移动应用 API 地址**：
   
   编辑 `mobile/.env`：
   ```env
   # Android 模拟器
   API_BASE_URL=http://10.0.2.2:4000
   
   # iOS 模拟器
   API_BASE_URL=http://localhost:4000
   
   # 真机测试（替换为实际 IP）
   API_BASE_URL=http://192.168.1.100:4000
   ```

### 获取本机 IP 地址

**Linux/Mac**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows**:
```cmd
ipconfig | findstr IPv4
```

### 生产环境

如果通过 Traefik 代理，配置 HTTPS 地址：

```env
API_BASE_URL=https://api.yourdomain.com
```

## 测试 API 连接

可以使用以下命令测试 API 是否可访问：

```bash
# 健康检查
curl http://localhost:4000/api/c/health

# 测试端点
curl http://localhost:4000/api/c/hello
```

## 常见问题

### 1. 真机无法连接 API

**问题**：真机测试时无法连接到 `localhost:4000`

**解决**：
- 确保手机和电脑在同一网络
- 使用电脑的实际 IP 地址，而不是 `localhost`
- 检查防火墙是否阻止了 4000 端口
- 确保 `capp/backend` 正在运行

### 2. Android 模拟器连接问题

**问题**：Android 模拟器无法连接到 `localhost`

**解决**：
- Android 模拟器使用 `10.0.2.2` 代替 `localhost`
- 配置：`API_BASE_URL=http://10.0.2.2:4000`

### 3. CORS 错误

**问题**：浏览器或移动应用出现 CORS 错误

**解决**：
- `capp/backend` 已配置 CORS，允许所有来源
- 如果仍有问题，检查后端 CORS 配置

### 4. Token 过期

**问题**：Token 过期导致 401 错误

**解决**：
- 应用会自动清除过期 Token 并跳转到登录页
- 用户需要重新登录获取新 Token

## 开发建议

1. **使用 Postman 或 curl 测试 API**：在开发移动应用前，先确保 API 正常工作
2. **查看后端日志**：`capp/backend` 会输出详细的请求日志，便于调试
3. **使用网络调试工具**：React Native Debugger 或 Flipper 可以查看网络请求
4. **错误处理**：所有 API 调用都应该有错误处理，给用户友好的提示



