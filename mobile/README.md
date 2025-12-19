# LingAdmin Mobile App

React Native 移动应用，为 LingAdmin 系统提供移动端支持。

## 功能特性

- ✅ 用户认证（登录、注册、邮箱验证）
- ✅ 传单详情查询（搜索、分页、多语言、邮编筛选）
- ✅ 加油站查询（根据邮编查找附近加油站）
- ✅ 邮编管理（添加、编辑、删除常用邮编）

## 技术栈

- **React Native** 0.73.0
- **TypeScript**
- **React Navigation** - 导航管理
- **Axios** - HTTP 请求
- **AsyncStorage** - 本地存储
- **Context API** - 状态管理

## 项目结构

```
mobile/
├── src/
│   ├── config/          # 配置文件
│   │   └── api.ts       # API 配置
│   ├── context/         # Context 状态管理
│   │   └── AuthContext.tsx
│   ├── navigation/      # 导航配置
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/         # 页面组件
│   │   ├── auth/        # 认证页面
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── main/        # 主功能页面
│   │       ├── HomeScreen.tsx
│   │       ├── FlyerDetailsScreen.tsx
│   │       ├── GasStationsScreen.tsx
│   │       └── PostcodeManagerScreen.tsx
│   └── services/        # API 服务
│       ├── api.ts
│       ├── authService.ts
│       ├── flyerService.ts
│       ├── gasService.ts
│       └── postcodeService.ts
├── App.tsx              # 应用入口
├── index.js             # 注册入口
└── package.json
```

## 安装和运行

### 前置要求

- Node.js >= 18
- React Native 开发环境
  - Android: Android Studio, JDK
  - iOS: Xcode (仅 macOS)

### 安装依赖

```bash
cd mobile
npm install
# 或
yarn install
```

### 配置 API 地址

移动应用复用 `capp/backend` 服务（已在运行，端口 4000）。

复制 `.env.example` 为 `.env` 并配置 API 地址：

```bash
cp .env.example .env
```

编辑 `.env` 文件，根据您的运行环境选择：

**开发环境配置**：

```env
# Android 模拟器
API_BASE_URL=http://10.0.2.2:4000

# iOS 模拟器
API_BASE_URL=http://localhost:4000

# 真机测试（替换为您的电脑 IP）
API_BASE_URL=http://192.168.1.100:4000
```

**Docker 环境**（如果 capp-backend 在 Docker 中运行）：

```env
API_BASE_URL=http://localhost:4000
```

**生产环境**（通过 Traefik 代理）：

```env
API_BASE_URL=https://api.yourdomain.com
```

**重要提示**：
- ✅ 移动应用完全复用 `capp/backend`，无需额外后端服务
- ✅ `capp/backend` 已提供所有需要的 API（认证、传单查询、加油站、邮编管理）
- ✅ 真机测试时，`localhost` 指向设备本身，需要使用电脑的实际 IP 地址
- ✅ 可以通过 `ifconfig` (Linux/Mac) 或 `ipconfig` (Windows) 查看本机 IP

### 运行应用

#### 快速启动（推荐）

1. **启动 Metro Bundler**（在一个终端窗口）:
   ```bash
   npm start
   ```

2. **启动应用**（在另一个终端窗口）:
   ```bash
   # Android
   npm run android
   
   # iOS (仅 macOS)
   npm run ios
   ```

#### 详细步骤

请参考 [QUICK_START.md](./QUICK_START.md) 获取完整的启动指南，包括：
- 前置要求检查
- 详细安装步骤
- 环境配置
- 常见问题解决
- 真机调试指南

## 开发说明

### API 集成

所有 API 调用都通过 `src/services/` 目录下的服务类进行：

- `authService.ts` - 认证相关 API
- `flyerService.ts` - 传单查询 API
- `gasService.ts` - 加油站查询 API
- `postcodeService.ts` - 邮编管理 API

### 状态管理

使用 React Context API 管理全局状态：

- `AuthContext` - 用户认证状态

### 导航

使用 React Navigation 实现导航：

- `RootNavigator` - 根据认证状态切换 Auth/Main 导航
- `AuthNavigator` - 登录/注册页面导航
- `MainNavigator` - 主功能页面导航（底部标签栏）

### 本地存储

使用 AsyncStorage 存储：

- 访问令牌（access_token）
- 刷新令牌（refresh_token）
- 用户邮编（zip_code）

## 功能说明

### 1. 用户认证

- **登录**: 使用邮箱和密码登录
- **注册**: 创建新账户（需要邮箱验证）
- **自动登录**: 应用启动时检查已保存的 token

### 2. 传单详情查询

- 支持关键词搜索
- 支持多语言（中文/English/繁體中文）
- 支持邮编筛选
- 无限滚动加载更多
- 下拉刷新

### 3. 加油站查询

- 根据邮编查询附近加油站
- 显示距离和价格信息
- 支持设置最大搜索距离

### 4. 邮编管理

- 添加常用邮编
- 编辑邮编标签
- 删除邮编
- 邮编格式自动验证和格式化

## 后端服务

移动应用复用现有的 `capp/backend` 服务，该服务已提供所有需要的 API：

- ✅ `/api/c/auth/*` - 用户认证（登录、注册、验证邮箱）
- ✅ `/api/c/flyer_details` - 传单详情查询
- ✅ `/api/c/gas` - 加油站查询
- ✅ `/api/c/postcode` - 邮编管理

**无需额外配置后端服务**，只需确保 `capp/backend` 正在运行（默认端口 4000）。

## 注意事项

1. **API 地址配置**: 确保 `.env` 文件中的 `API_BASE_URL` 指向正确的后端地址
2. **网络权限**: Android 需要在 `AndroidManifest.xml` 中添加网络权限
3. **iOS 网络配置**: iOS 需要在 `Info.plist` 中配置允许的域名（如果使用 HTTPS）
4. **开发环境**: 开发时可以使用 `http://localhost:4000`，但真机测试需要使用实际 IP 地址

## 构建发布

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

在 Xcode 中：
1. 选择 Product > Archive
2. 上传到 App Store 或导出 IPA

## 常见问题

### 1. Metro Bundler 启动失败

清除缓存并重新启动：

```bash
npm start -- --reset-cache
```

### 2. Android 构建失败

清理构建：

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 3. iOS 构建失败

清理 Xcode 缓存：

```bash
cd ios
pod deintegrate
pod install
cd ..
```

## 后续优化建议

- [ ] 添加图片缓存
- [ ] 实现离线数据缓存
- [ ] 添加推送通知
- [ ] 优化列表性能（使用 FlatList 优化）
- [ ] 添加深色模式支持
- [ ] 添加多语言本地化
- [ ] 添加错误边界和错误报告
- [ ] 添加单元测试和集成测试

## 许可证

与主项目保持一致。



