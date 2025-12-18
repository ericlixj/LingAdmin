# LingAdmin 系统架构

## 整体架构

```
┌─────────────────┐         ┌─────────────────┐
│  admin/frontend │         │  admin/backend  │
│   (React)      │────────▶│   (FastAPI)     │
│   管理后台      │         │   管理后台API   │
└─────────────────┘         └─────────────────┘
                                      │
                                      │ 共享
                                      ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │     数据库      │
                            └─────────────────┘
                                      │
                                      │ 共享
                                      ▼
                            ┌─────────────────┐
                            │  OpenSearch     │
                            │   搜索引擎      │
                            └─────────────────┘
                                      ▲
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
        ┌───────────┴──────────┐          ┌───────────┴──────────┐
        │                      │          │                      │
┌───────┴────────┐    ┌───────┴────────┐  │  mobile (React      │
│ capp/frontend │    │ capp/backend   │  │   Native)            │
│  (React Web)  │───▶│  (Node.js)    │◀─│                      │
│   C端Web应用   │    │   C端后端API   │  │  移动应用            │
└───────────────┘    └────────────────┘  └──────────────────────┘
```

## 服务说明

### 1. 管理后台（Admin）

- **前端**: `admin/frontend` - React + TypeScript
- **后端**: `admin/backend` - FastAPI (Python)
- **用途**: 系统管理、数据管理、用户管理

### 2. C端应用（Capp）

#### 2.1 Web 前端 (`capp/frontend`)
- **技术栈**: React + Vite
- **后端**: 使用 `capp/backend`
- **API 端点**: `/api/c/*`
- **配置**: 通过 `VITE_API_URL` 环境变量配置后端地址
- **默认**: `http://localhost:4000`

#### 2.2 移动应用 (`mobile`)
- **技术栈**: React Native + TypeScript
- **后端**: 使用 `capp/backend`
- **API 端点**: `/api/c/*`
- **配置**: 通过 `.env` 文件中的 `API_BASE_URL` 配置
- **默认**: `http://localhost:4000`

#### 2.3 后端服务 (`capp/backend`)
- **技术栈**: Node.js + Express
- **端口**: 4000
- **功能**:
  - 用户认证（登录、注册、邮箱验证）
  - 传单详情查询（OpenSearch）
  - 加油站查询
  - 邮编管理
- **数据库**: PostgreSQL（与 admin/backend 共享）
- **搜索引擎**: OpenSearch（与 admin/backend 共享）

## API 端点

### capp/backend 提供的 API

所有 API 前缀为 `/api/c/`：

#### 认证相关
- `POST /api/c/auth/register` - 用户注册
- `POST /api/c/auth/login` - 用户登录
- `GET /api/c/auth/me` - 获取当前用户信息
- `GET /api/c/auth/verify-email` - 验证邮箱

#### 传单详情
- `GET /api/c/flyer_details` - 搜索传单详情
  - 参数: `q`, `lang`, `zip_code`, `_start`, `_end`

#### 加油站
- `GET /api/c/gas` - 查询加油站
  - 参数: `postcode`, `maxDistance`

#### 邮编管理
- `GET /api/c/postcode` - 获取用户邮编列表
- `POST /api/c/postcode` - 创建邮编
- `PATCH /api/c/postcode/:id` - 更新邮编
- `DELETE /api/c/postcode/:id` - 删除邮编

## 数据共享

### 共享资源

1. **PostgreSQL 数据库**
   - `admin/backend` 和 `capp/backend` 共享同一个数据库
   - 用户表、角色表、传单数据等

2. **OpenSearch**
   - `admin/backend` 和 `capp/backend` 共享同一个 OpenSearch 实例
   - 用于传单详情搜索

### 数据隔离

- 用户数据通过 `user_id` 进行隔离
- 每个用户只能访问自己的数据（邮编等）

## 配置说明

### capp/frontend (React Web)

通过环境变量 `VITE_API_URL` 配置：

```bash
# .env 或环境变量
VITE_API_URL=http://localhost:4000
```

或在 `vite.config.js` 中配置。

### mobile (React Native)

通过 `.env` 文件配置：

```env
API_BASE_URL=http://localhost:4000
```

**不同环境的配置**：
- Android 模拟器: `http://10.0.2.2:4000`
- iOS 模拟器: `http://localhost:4000`
- 真机: `http://<电脑IP>:4000`

## 优势

### 1. 代码复用
- ✅ `capp/frontend` 和 `mobile` 共享相同的后端 API
- ✅ 业务逻辑统一，减少重复开发
- ✅ API 接口一致，便于维护

### 2. 数据一致性
- ✅ Web 和移动端使用相同的数据源
- ✅ 用户在一个平台的操作，另一个平台立即可见
- ✅ 统一的认证机制

### 3. 开发效率
- ✅ 只需维护一个后端服务
- ✅ API 变更只需更新一处
- ✅ 测试和调试更简单

### 4. 资源利用
- ✅ 共享数据库和搜索引擎
- ✅ 减少服务器资源消耗
- ✅ 统一的数据备份和恢复

## 部署架构

### 开发环境

```
localhost:5174  →  capp/frontend (Vite dev server)
localhost:4000  →  capp/backend (Node.js)
localhost:8000  →  admin/backend (FastAPI)
localhost:3000  →  admin/frontend (Vite dev server)
```

### 生产环境（Docker）

```
Traefik (反向代理)
├── admin.yourdomain.com → admin/frontend
├── admin-api.yourdomain.com → admin/backend
├── app.yourdomain.com → capp/frontend
└── api.yourdomain.com → capp/backend
```

## 总结

**是的，`capp/frontend`（React Web）和 `mobile`（React Native）都使用 `capp/backend` 作为后端服务。**

这种架构的优势：
- ✅ 统一的后端 API
- ✅ 代码复用和维护简单
- ✅ 数据一致性
- ✅ 开发效率高


