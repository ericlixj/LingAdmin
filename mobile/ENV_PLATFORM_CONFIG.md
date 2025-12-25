# 平台特定的环境变量配置

## 概述

现在支持在 `.env` 文件中同时配置 iOS 和 Android 的 API 地址，系统会在运行时根据平台自动选择。

## 配置方式

在 `mobile/.env` 文件中，你可以同时配置：

```bash
# 通用 API 地址（如果未设置平台特定的地址，将使用此值）
API_BASE_URL=http://localhost:4000

# iOS 平台特定的 API 地址
API_BASE_URL_IOS=http://localhost:4000

# Android 平台特定的 API 地址
API_BASE_URL_ANDROID=http://10.0.2.2:4000

# API 超时时间（毫秒）
API_TIMEOUT=30000
```

## 优先级

系统会按以下优先级选择 API 地址：

1. **平台特定的环境变量**（最高优先级）
   - iOS: `API_BASE_URL_IOS`
   - Android: `API_BASE_URL_ANDROID`

2. **通用环境变量**
   - `API_BASE_URL`

3. **默认值**（如果以上都未设置）
   - iOS 开发环境: `http://localhost:4000`
   - Android 开发环境: `http://10.0.2.2:4000`
   - 生产环境: `https://c-api.kxf.ca`

## 使用示例

### 场景 1: 开发环境（推荐）

```bash
# .env
API_BASE_URL_IOS=http://localhost:4000
API_BASE_URL_ANDROID=http://10.0.2.2:4000
API_TIMEOUT=30000
```

这样配置后：
- iOS 模拟器会自动使用 `http://localhost:4000`
- Android 模拟器会自动使用 `http://10.0.2.2:4000`
- 无需每次切换平台时修改配置

### 场景 2: 使用通用地址

```bash
# .env
API_BASE_URL=http://192.168.1.100:4000
API_TIMEOUT=30000
```

如果只设置了 `API_BASE_URL`，iOS 和 Android 都会使用这个地址。

### 场景 3: 混合配置

```bash
# .env
API_BASE_URL=http://192.168.1.100:4000
API_BASE_URL_IOS=http://localhost:4000
API_BASE_URL_ANDROID=http://10.0.2.2:4000
```

这样配置后：
- iOS 使用 `http://localhost:4000`
- Android 使用 `http://10.0.2.2:4000`
- 其他平台（如 Web）使用 `http://192.168.1.100:4000`

## 生产环境配置

### EAS 构建配置

在生产环境构建时，环境变量通过 `eas.json` 配置。你可以在不同构建配置中设置平台特定的 API 地址：

```json
{
  "build": {
    "production": {
      "env": {
        "API_BASE_URL": "https://c-api.kxf.ca",
        "API_BASE_URL_IOS": "https://c-api.kxf.ca",
        "API_BASE_URL_ANDROID": "https://c-api.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    },
    "preview": {
      "env": {
        "API_BASE_URL": "https://c-api-staging.kxf.ca",
        "API_BASE_URL_IOS": "https://c-api-staging.kxf.ca",
        "API_BASE_URL_ANDROID": "https://c-api-staging.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    }
  }
}
```

### 生产环境场景

**场景 1: 统一生产地址（推荐）**

大多数情况下，生产环境 iOS 和 Android 使用相同的 API 地址：

```json
{
  "env": {
    "API_BASE_URL": "https://c-api.kxf.ca"
  }
}
```

系统会自动使用 `API_BASE_URL` 作为两个平台的地址。

**场景 2: 平台特定的生产地址**

如果生产环境需要不同的地址（例如不同的 CDN 或负载均衡）：

```json
{
  "env": {
    "API_BASE_URL_IOS": "https://ios-api.kxf.ca",
    "API_BASE_URL_ANDROID": "https://android-api.kxf.ca"
  }
}
```

## 注意事项

1. **环境变量在构建时注入**：
   - 开发环境：修改 `.env` 文件后，需要重启开发服务器（`npm start`）才能生效
   - 生产环境：环境变量在 EAS 构建时注入，修改 `eas.json` 后需要重新构建

2. **平台检测**：系统使用 `Platform.OS` 来检测当前平台，支持的值：
   - `ios` - iOS 平台
   - `android` - Android 平台
   - `web` - Web 平台

3. **开发 vs 生产**：
   - **开发环境**（`__DEV__ === true`）：如果未设置环境变量，会使用平台特定的默认值
   - **生产环境**：如果未设置环境变量，默认使用 `https://c-api.kxf.ca`

4. **EAS 构建**：生产环境的环境变量在 `eas.json` 中配置，不会读取 `.env` 文件

## 验证配置

你可以在代码中查看当前使用的 API 地址：

```typescript
import {API_CONFIG} from './config/api';

console.log('Current API URL:', API_CONFIG.BASE_URL);
```

或者在应用启动时查看控制台日志，会显示当前使用的 API 地址。
