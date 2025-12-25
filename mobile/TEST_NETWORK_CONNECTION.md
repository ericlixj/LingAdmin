# 测试 Android 模拟器网络连接

## 当前状态

✅ **网络层正常**：
- Android 模拟器可以 ping 通 `10.0.2.2`（Windows localhost）
- Windows localhost:4000 可以访问（WSL 网络桥接正常）

✅ **配置已设置**：
- `adb reverse tcp:4000 tcp:4000` 已设置
- `.env` 中配置：`API_BASE_URL=http://localhost:4000`

## 问题诊断

既然 Windows 的 localhost:4000 可以访问，理论上：
- **方案 A（推荐）**：使用 `localhost:4000` + `adb reverse` ✅
- **方案 B**：使用 `10.0.2.2:4000`（需要 Windows 防火墙允许）

## 测试步骤

### 1. 确认应用使用的 API 地址

在应用启动时，查看控制台日志，应该看到：
```
✅ [API Service] Initialized with base URL: http://localhost:4000
```

或者：
```
🌐 [API Request] { baseURL: 'http://localhost:4000', ... }
```

### 2. 如果看到的是 `10.0.2.2:4000`

说明 `.env` 文件没有被正确加载，可能原因：
- 应用需要重启（完全关闭后重新打开）
- Metro bundler 需要清除缓存并重启
- `.env` 文件路径不正确

**解决方案**：

```bash
cd mobile

# 清除缓存
rm -rf node_modules/.cache .expo .metro

# 重启 Metro
npm start -- --clear
```

### 3. 如果仍然无法连接

检查应用控制台的详细错误信息：

- **`ECONNREFUSED`**：服务未运行或端口不对
- **`ENOTFOUND`**：DNS 解析失败
- **`ETIMEDOUT`**：连接超时
- **`Network Error`**：网络层问题

## 快速修复

### 方案 A：使用 localhost + adb reverse（当前配置）✅

```bash
# 1. 确认 adb reverse 已设置
adb reverse --list | grep 4000

# 2. 确认 .env 配置
cat mobile/.env | grep API_BASE_URL
# 应该显示：API_BASE_URL=http://localhost:4000

# 3. 重启应用（完全关闭后重新打开）
```

### 方案 B：使用 10.0.2.2（如果方案 A 不行）

```bash
# 1. 修改 .env
echo "API_BASE_URL=http://10.0.2.2:4000" > mobile/.env

# 2. 在 Windows PowerShell（管理员）中允许防火墙
New-NetFirewallRule -DisplayName "Android Emulator Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow

# 3. 重启应用
```

## 验证连接

在应用中进行任何需要网络的操作（如登录），查看控制台：

**成功**：
```
✅ [API Response Raw] { status: 200, ... }
```

**失败**：
```
❌ [API Network Error] { message: '网络错误：无法连接到服务器', ... }
```

## 总结

当前配置应该可以工作：
- ✅ Windows localhost:4000 可访问
- ✅ adb reverse 已设置
- ✅ .env 配置正确

**如果仍然无法连接，请**：
1. 完全重启应用（不要只是重新加载）
2. 查看应用控制台的详细错误信息
3. 确认后端服务正在运行：`curl http://localhost:4000/api/c/health`
