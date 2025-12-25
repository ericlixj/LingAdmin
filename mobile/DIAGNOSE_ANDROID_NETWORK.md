# Android 模拟器网络连接诊断

## 当前状态

- ✅ Windows localhost:4000 可以访问（说明 WSL 网络桥接正常）
- ✅ 后端服务绑定到 `0.0.0.0:4000`（监听所有接口）
- ❌ Android 模拟器无法访问 `10.0.2.2:4000`

## 可能的原因

### 1. Windows 防火墙阻止模拟器连接

即使 Windows 的 localhost 可以访问，防火墙可能阻止来自模拟器虚拟网络的连接。

**解决方案**：

在 Windows PowerShell（管理员）中运行：

```powershell
# 允许端口 4000 的入站连接
New-NetFirewallRule -DisplayName "Android Emulator Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

### 2. 服务需要重启

如果服务是在修改 `0.0.0.0` 绑定之前启动的，需要重启。

**解决方案**：

```bash
# 在 WSL 中
cd capp/backend

# 停止当前服务（Ctrl+C）
# 重新启动
npm start

# 确认输出显示：
# [INFO] c-backend listening on 0.0.0.0:4000
```

### 3. 使用 adb reverse（最简单）

如果上述方案都不行，使用 adb 端口转发：

```bash
# 在 WSL 中
adb reverse tcp:4000 tcp:4000

# 然后在 mobile/.env 中使用：
API_BASE_URL=http://localhost:4000
```

**工作原理**：
- Android 模拟器访问 `localhost:4000`
- adb 转发到 Windows 的 `localhost:4000`
- Windows 的 `localhost:4000` → WSL（已正常工作）✅

### 4. 检查服务是否监听 IPv4

虽然显示 `*:4000`，但可能只监听 IPv6。

**检查**：

```bash
# 在 WSL 中
ss -tuln | grep ":4000"
# 应该看到 tcp 或 tcp6
```

## 推荐解决方案

### 方案 A: 使用 adb reverse（最简单）✅

```bash
# 1. 在 WSL 中设置端口转发
adb reverse tcp:4000 tcp:4000

# 2. 在 mobile/.env 中使用
API_BASE_URL=http://localhost:4000

# 3. 重启应用
```

### 方案 B: 允许 Windows 防火墙

```powershell
# 在 Windows PowerShell（管理员）中
New-NetFirewallRule -DisplayName "Android Emulator Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

然后使用：
```env
API_BASE_URL=http://10.0.2.2:4000
```

## 验证

修复后，在 Android 模拟器中：
1. 打开应用
2. 尝试登录
3. 查看控制台，应该能看到成功的 API 请求

## 快速测试

在 Android 模拟器中测试连接：

```bash
# 在 WSL 中，使用 adb 在模拟器中执行 curl
adb shell curl http://10.0.2.2:4000/api/c/health

# 或测试 localhost（如果使用 adb reverse）
adb shell curl http://localhost:4000/api/c/health
```

如果这个命令成功，说明网络连接正常，问题可能在应用配置。
