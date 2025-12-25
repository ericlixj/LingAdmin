# Android 模拟器网络连接状态

## ✅ 当前配置状态

### 1. 网络层测试
- ✅ Android 模拟器可以 ping 通 `10.0.2.2`（Windows localhost）
- ✅ Windows localhost:4000 可以访问（WSL 网络桥接正常）

### 2. 端口转发
- ✅ `adb reverse tcp:4000 tcp:4000` 已设置
- ✅ 验证：`adb reverse --list` 显示 `host-18 tcp:4000 tcp:4000`

### 3. 应用配置
- ✅ `.env` 文件：`API_BASE_URL=http://localhost:4000`
- ✅ 后端服务：运行在 `0.0.0.0:4000`（监听所有接口）

## 🔄 工作原理

```
Android 模拟器
  ↓ (请求 localhost:4000)
adb reverse 端口转发
  ↓ (转发到 Windows localhost:4000)
Windows localhost:4000
  ↓ (WSL 网络桥接)
WSL localhost:4000
  ↓
后端服务 (0.0.0.0:4000)
```

## 📋 代码逻辑

`mobile/src/config/api.ts` 中的优先级：
1. **优先**：使用 `.env` 中的 `API_BASE_URL` ✅（当前：`http://localhost:4000`）
2. **备选**：Android 默认 `http://10.0.2.2:4000`（仅在未设置环境变量时使用）

## 🎯 如果仍然无法连接

### 步骤 1: 确认应用使用的 URL

在应用控制台查看日志：
- 应该看到：`✅ [API Service] Initialized with base URL: http://localhost:4000`
- 如果看到：`http://10.0.2.2:4000`，说明环境变量未加载

### 步骤 2: 完全重启应用

1. **完全关闭应用**（不要只是重新加载）
2. **清除 Metro 缓存**：
   ```bash
   cd mobile
   rm -rf node_modules/.cache .expo .metro
   npm start -- --clear
   ```
3. **重新打开应用**

### 步骤 3: 检查后端服务

```bash
# 在 WSL 中测试
curl http://localhost:4000/api/c/health

# 应该返回：
# {"code":0,"message":"ok","data":{"service":"c-backend"}}
```

### 步骤 4: 如果还是不行，尝试方案 B

如果 `localhost:4000` + `adb reverse` 仍然不行，可以改用 `10.0.2.2:4000`：

```bash
# 1. 修改 .env
echo "API_BASE_URL=http://10.0.2.2:4000" > mobile/.env

# 2. 在 Windows PowerShell（管理员）中允许防火墙
New-NetFirewallRule -DisplayName "Android Emulator Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow

# 3. 重启应用
```

## ✅ 总结

**当前配置应该可以工作**，因为：
- ✅ Windows localhost:4000 可访问（已验证）
- ✅ adb reverse 已设置（已验证）
- ✅ .env 配置正确（已验证）

**如果仍然无法连接，请**：
1. 查看应用控制台的详细错误信息
2. 确认应用实际使用的 API URL（查看日志）
3. 完全重启应用和 Metro bundler
