# 环境配置说明

## 概述

项目支持两个环境配置：
- **本地开发环境**：使用 `.env` 文件中的配置
- **生产环境**：使用 `https://c-api.kxf.ca`

## 环境配置

### 1. 本地开发环境

**配置文件**: `mobile/.env`

```env
# API 配置
# Android 模拟器使用 10.0.2.2 访问宿主机
# iOS 模拟器可以使用 localhost
# 真机需要使用电脑的 IP 地址（如：http://192.168.1.100:4000）
API_BASE_URL=http://10.0.2.2:4000

# 可选：API 超时时间（毫秒）
API_TIMEOUT=30000
```

**使用场景**：
- 本地开发
- 使用 Expo Go 或原生开发构建
- 连接到本地后端服务

**如何修改**：
直接编辑 `.env` 文件，修改 `API_BASE_URL` 的值。

### 2. 生产环境

**配置文件**: `mobile/eas.json`

```json
{
  "build": {
    "production": {
      "env": {
        "API_BASE_URL": "https://c-api.kxf.ca",
        "API_TIMEOUT": "30000"
      }
    }
  }
}
```

**使用场景**：
- EAS 生产构建
- 发布到应用商店
- 连接到生产服务器

**API 地址**: `https://c-api.kxf.ca`

## 配置优先级

API 地址的优先级（从高到低）：

1. **环境变量** (`API_BASE_URL` from `.env` 或 EAS 环境变量)
2. **代码默认值**：
   - 开发模式 (`__DEV__ = true`)：根据平台选择
     - Android: `http://10.0.2.2:4000`
     - iOS: `http://localhost:4000`
   - 生产模式：`https://c-api.kxf.ca`

## 构建配置

### EAS 构建环境

在 `eas.json` 中已配置：

- **development**: 使用 `http://10.0.2.2:4000`（开发客户端）
- **preview**: 使用 `https://c-api.kxf.ca`（预览构建）
- **production**: 使用 `https://c-api.kxf.ca`（生产构建）

### 本地开发构建

使用 `.env` 文件中的配置。

## 如何切换环境

### 本地开发

1. **修改 `.env` 文件**：
   ```bash
   cd mobile
   nano .env
   ```

2. **修改 `API_BASE_URL`**：
   ```env
   API_BASE_URL=http://10.0.2.2:4000  # Android 模拟器
   # 或
   API_BASE_URL=http://localhost:4000  # iOS 模拟器
   # 或
   API_BASE_URL=http://192.168.1.100:4000  # 真机
   ```

3. **清除缓存并重启**：
   ```bash
   npm run start:clear
   ```

### 生产构建

生产构建会自动使用 `eas.json` 中配置的环境变量，无需修改代码。

```bash
# 构建生产版本
eas build --platform android --profile production
eas build --platform ios --profile production
```

## 验证配置

### 开发环境

运行应用后，在登录页面会显示当前使用的 API 地址（开发模式下）。

### 生产环境

构建后，应用会自动使用生产 API 地址。

## 环境变量说明

| 变量名 | 说明 | 开发环境默认值 | 生产环境值 |
|--------|------|---------------|-----------|
| `API_BASE_URL` | API 基础地址 | `http://10.0.2.2:4000` | `https://c-api.kxf.ca` |
| `API_TIMEOUT` | API 超时时间（毫秒） | `30000` | `30000` |

## 注意事项

1. **`.env` 文件不应提交到 Git**（已在 `.gitignore` 中）
2. **生产环境配置在 `eas.json` 中**，会随代码一起提交
3. **修改 `.env` 后需要清除缓存**：`npm run start:clear`
4. **EAS 构建会自动使用 `eas.json` 中的环境变量**

## 故障排查

### 问题：开发环境使用了错误的 API 地址

**解决方案**：
1. 检查 `.env` 文件是否存在且配置正确
2. 清除缓存：`npm run start:clear`
3. 重新启动应用

### 问题：生产构建使用了错误的 API 地址

**解决方案**：
1. 检查 `eas.json` 中的 `production` 配置
2. 确认环境变量 `API_BASE_URL` 已正确设置
3. 重新构建应用

## 相关文件

- `mobile/.env` - 本地开发环境配置
- `mobile/eas.json` - EAS 构建环境配置
- `mobile/app.config.js` - Expo 应用配置
- `mobile/src/config/api.ts` - API 配置代码
