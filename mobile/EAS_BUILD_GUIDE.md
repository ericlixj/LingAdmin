# EAS 构建指南 - 不同环境打包

## 概述

项目配置了三个构建环境（profiles），每个环境使用不同的 API 地址和配置。

## 构建配置文件

### 1. development（开发环境）

**用途**：开发测试，使用开发客户端

**配置**：
- API 地址：`http://10.0.2.2:4000`
- 开发客户端：启用
- 分发方式：内部测试

**特点**：
- 包含开发工具
- 可以热重载
- 连接到本地或开发服务器

### 2. preview（预览环境）

**用途**：内部测试，使用生产 API

**配置**：
- API 地址：`https://c-api.kxf.ca`
- 开发客户端：禁用
- 分发方式：内部测试

**特点**：
- 接近生产环境的构建
- 使用生产 API
- 适合内部测试

### 3. production（生产环境）

**用途**：发布到应用商店

**配置**：
- API 地址：`https://c-api.kxf.ca`
- 开发客户端：禁用
- 分发方式：应用商店
- 自动递增版本号：启用

**特点**：
- 优化后的生产构建
- 使用生产 API
- 自动管理版本号

## 构建命令

### Android 构建

#### 开发环境构建
```bash
cd mobile
eas build --platform android --profile development
```

#### 预览环境构建
```bash
cd mobile
eas build --platform android --profile preview
```

#### 生产环境构建
```bash
cd mobile
eas build --platform android --profile production
```

### iOS 构建

#### 开发环境构建
```bash
cd mobile
eas build --platform ios --profile development
```

#### 预览环境构建
```bash
cd mobile
eas build --platform ios --profile preview
```

#### 生产环境构建
```bash
cd mobile
eas build --platform ios --profile production
```

### 同时构建 Android 和 iOS

```bash
# 开发环境
eas build --platform all --profile development

# 预览环境
eas build --platform all --profile preview

# 生产环境
eas build --platform all --profile production
```

## 构建选项

### 本地构建（可选）

如果需要在本地构建（而不是在 EAS 服务器上）：

```bash
# 添加 --local 标志
eas build --platform android --profile production --local
```

**注意**：本地构建需要配置完整的开发环境（Android SDK、Xcode 等）。

### 查看构建历史

```bash
# 查看所有构建
eas build:list

# 查看特定平台的构建
eas build:list --platform android
eas build:list --platform ios
```

### 下载构建产物

```bash
# 下载最新的构建
eas build:download

# 下载特定构建 ID
eas build:download --id <build-id>
```

## 环境变量配置

### 当前配置

在 `eas.json` 中，每个 profile 都配置了环境变量：

```json
{
  "build": {
    "development": {
      "env": {
        "API_BASE_URL": "http://10.0.2.2:4000",
        "API_TIMEOUT": "30000"
      }
    },
    "preview": {
      "env": {
        "API_BASE_URL": "https://c-api.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    },
    "production": {
      "env": {
        "API_BASE_URL": "https://c-api.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    }
  }
}
```

### 修改环境变量

如果需要修改某个环境的 API 地址，编辑 `eas.json` 文件：

```json
{
  "build": {
    "production": {
      "env": {
        "API_BASE_URL": "https://your-new-api.com",
        "API_TIMEOUT": "30000"
      }
    }
  }
}
```

## 构建流程

### 1. 开发环境构建流程

```bash
# 1. 构建开发版本
eas build --platform android --profile development

# 2. 等待构建完成
# 3. 下载 APK
eas build:download

# 4. 安装到设备
adb install <downloaded-apk>
```

### 2. 预览环境构建流程

```bash
# 1. 构建预览版本
eas build --platform android --profile preview

# 2. 等待构建完成
# 3. 下载 APK 并分发给测试人员
eas build:download
```

### 3. 生产环境构建流程

```bash
# 1. 构建生产版本
eas build --platform android --profile production

# 2. 等待构建完成
# 3. 提交到应用商店
eas submit --platform android --profile production
```

## 版本管理

### 自动版本递增

生产环境配置了 `"autoIncrement": true`，每次构建会自动递增版本号。

### 手动指定版本

如果需要手动指定版本：

```bash
eas build --platform android --profile production --version 1.0.1
```

## 构建配置详解

### development 配置

```json
{
  "development": {
    "developmentClient": true,      // 启用开发客户端
    "distribution": "internal",     // 内部测试分发
    "env": {
      "API_BASE_URL": "http://10.0.2.2:4000"
    }
  }
}
```

**适用场景**：
- 本地开发测试
- 需要热重载功能
- 连接到本地后端

### preview 配置

```json
{
  "preview": {
    "distribution": "internal",     // 内部测试分发
    "env": {
      "API_BASE_URL": "https://c-api.kxf.ca"
    }
  }
}
```

**适用场景**：
- 内部测试
- 使用生产 API 进行测试
- 不需要开发工具

### production 配置

```json
{
  "production": {
    "autoIncrement": true,           // 自动递增版本号
    "env": {
      "API_BASE_URL": "https://c-api.kxf.ca"
    }
  }
}
```

**适用场景**：
- 发布到应用商店
- 生产环境使用
- 需要版本管理

## 常见问题

### Q: 如何知道构建使用了哪个环境？

A: 构建日志会显示使用的 profile 和环境变量。也可以在应用启动时查看登录页面的调试信息（开发模式下）。

### Q: 可以添加更多环境吗？

A: 可以，在 `eas.json` 的 `build` 部分添加新的 profile：

```json
{
  "build": {
    "staging": {
      "env": {
        "API_BASE_URL": "https://staging-api.kxf.ca"
      }
    }
  }
}
```

然后使用：
```bash
eas build --platform android --profile staging
```

### Q: 构建时如何查看环境变量？

A: 构建日志会显示环境变量。也可以在 `app.config.js` 中添加日志：

```javascript
console.log('API_BASE_URL:', process.env.API_BASE_URL);
```

### Q: 本地开发时使用哪个配置？

A: 本地开发使用 `.env` 文件中的配置，不受 EAS 构建配置影响。

## 快速参考

| 环境 | Profile | API 地址 | 用途 |
|------|---------|---------|------|
| 开发 | `development` | `http://10.0.2.2:4000` | 本地开发测试 |
| 预览 | `preview` | `https://c-api.kxf.ca` | 内部测试 |
| 生产 | `production` | `https://c-api.kxf.ca` | 应用商店发布 |

## 最佳实践

1. **开发阶段**：使用 `development` profile 或本地开发
2. **测试阶段**：使用 `preview` profile 进行内部测试
3. **发布阶段**：使用 `production` profile 构建并提交到应用商店
4. **版本管理**：生产环境使用自动递增，其他环境可以手动指定

## 相关文件

- `mobile/eas.json` - EAS 构建配置
- `mobile/app.config.js` - Expo 应用配置
- `mobile/.env` - 本地开发环境变量
- `mobile/src/config/api.ts` - API 配置代码
