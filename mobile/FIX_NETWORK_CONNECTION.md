# 修复 Android 模拟器网络连接问题

## 问题症状

- ✅ 应用正确配置了 `10.0.2.2:4000`
- ✅ 后端服务正在运行（端口 4000 监听中）
- ✅ 本地可以访问 `http://localhost:4000`
- ❌ Android 模拟器无法连接，显示 `ERR_NETWORK` 或 `timeout`

## 可能的原因和解决方案

### 1. WSL 网络配置问题（最常见）

在 WSL 中，服务可能只监听 IPv6 或没有正确绑定到所有接口。

**解决方案 A：确保服务监听所有接口**

修改 `capp/backend/index.js`：

```javascript
// 修改前
app.listen(PORT, () => {
  console.log(`[INFO] c-backend listening on port ${PORT}`);
});

// 修改后 - 明确绑定到 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] c-backend listening on port ${PORT}`);
});
```

**解决方案 B：使用 WSL 端口转发**

在 Windows PowerShell（管理员权限）中运行：

```powershell
# 查看 WSL IP 地址
wsl hostname -I

# 添加端口转发规则（替换 <WSL_IP> 为实际的 WSL IP）
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=<WSL_IP>

# 查看端口转发规则
netsh interface portproxy show all
```

### 2. Windows 防火墙阻止

**解决方案：**

1. 打开 Windows 防火墙设置
2. 允许端口 4000 的入站连接
3. 或在 PowerShell（管理员）中运行：

```powershell
New-NetFirewallRule -DisplayName "WSL Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

### 3. 检查服务是否监听 IPv4

**验证命令：**

```bash
# 在 WSL 中检查
netstat -tuln | grep ":4000"

# 应该看到类似：
# tcp  0  0  0.0.0.0:4000  0.0.0.0:*  LISTEN
# 或
# tcp6  0  0  :::4000  :::*  LISTEN
```

如果只看到 `tcp6`，需要确保服务也监听 IPv4。

### 4. 使用 Windows 本地 IP 地址

如果 WSL 网络配置复杂，可以：

1. 在 Windows 中查找本机 IP：
   ```powershell
   ipconfig
   # 查找 IPv4 地址，例如：192.168.1.100
   ```

2. 在 WSL 中启动服务，确保绑定到该 IP 或 0.0.0.0

3. 在 Android 模拟器中使用 Windows 的 IP 地址（而不是 10.0.2.2）

### 5. 测试连接

**在 Android 模拟器中测试：**

```bash
# 在 WSL 中，使用 adb 在模拟器中执行 curl
adb shell curl http://10.0.2.2:4000/api/c/health
```

如果这个命令成功，说明网络连接正常，问题可能在应用配置。

## 快速修复步骤

### 步骤 1: 修改后端服务绑定

编辑 `capp/backend/index.js`：

```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[INFO] c-backend listening on 0.0.0.0:${PORT}`);
});
```

### 步骤 2: 重启后端服务

```bash
cd capp/backend
# 停止当前服务（Ctrl+C）
# 重新启动
npm start
# 或
nodemon index.js
```

### 步骤 3: 验证监听

```bash
netstat -tuln | grep ":4000"
# 应该看到 0.0.0.0:4000 或 :::4000
```

### 步骤 4: 测试连接

在 Android 模拟器中：
1. 打开应用
2. 查看控制台日志
3. 应该能看到成功的 API 请求

## 如果仍然无法连接

### 方案 A: 使用 Windows IP 地址

1. 在 Windows 中查找 IP：
   ```powershell
   ipconfig | findstr IPv4
   ```

2. 在 `mobile/.env` 中：
   ```env
   API_BASE_URL=http://<WINDOWS_IP>:4000
   ```
   例如：`API_BASE_URL=http://192.168.1.100:4000`

3. 重启应用

### 方案 B: 使用 adb 端口转发

```bash
# 将 Android 模拟器的 4000 端口转发到 WSL
adb reverse tcp:4000 tcp:4000

# 然后在 mobile/.env 中使用
API_BASE_URL=http://localhost:4000
```

### 方案 C: 在 Windows 中运行后端

如果 WSL 网络问题持续，可以在 Windows 中直接运行后端：

```powershell
cd capp\backend
npm start
```

然后 Android 模拟器使用 `10.0.2.2:4000` 应该可以正常工作。

## 验证修复

修复后，检查：

1. ✅ 后端服务监听 `0.0.0.0:4000`
2. ✅ `netstat -tuln | grep ":4000"` 显示正确的监听状态
3. ✅ `curl http://localhost:4000/api/c/health` 返回成功
4. ✅ Android 模拟器可以连接（查看应用日志）

## 相关文档

- [ANDROID_API_FIX.md](./ANDROID_API_FIX.md) - Android API 配置修复
- [DEBUG_NETWORK.md](./DEBUG_NETWORK.md) - 网络调试指南
- [WSL_ANDROID_SETUP.md](./WSL_ANDROID_SETUP.md) - WSL Android 设置
