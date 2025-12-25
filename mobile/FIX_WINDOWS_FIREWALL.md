# 修复 Android 模拟器网络连接（Windows 防火墙）

## 问题

- ✅ Windows localhost:4000 可以访问（WSL 网络正常）
- ✅ 后端服务绑定到 `0.0.0.0:4000`
- ❌ Android 模拟器无法访问 `10.0.2.2:4000`

## 原因

Windows 防火墙可能阻止了来自 Android 模拟器虚拟网络（10.0.2.x）的连接。

## 解决方案

### 方案 1: 允许 Windows 防火墙（推荐）

在 **Windows PowerShell（管理员权限）** 中运行：

```powershell
# 允许端口 4000 的入站连接
New-NetFirewallRule -DisplayName "Android Emulator Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

然后 Android 模拟器使用：
```env
API_BASE_URL=http://10.0.2.2:4000
```

### 方案 2: 使用 adb reverse（最简单）✅

既然 Windows 的 localhost:4000 可以访问，使用 adb reverse 最简单：

```bash
# 在 WSL 中运行（已设置）
adb reverse tcp:4000 tcp:4000
```

然后在 `mobile/.env` 中使用：
```env
API_BASE_URL=http://localhost:4000
```

**工作原理**：
- Android 模拟器访问 `localhost:4000`
- adb 转发到 Windows 的 `localhost:4000`
- Windows 的 `localhost:4000` → WSL（已正常工作）✅

### 方案 3: 检查并重启服务

确保服务已绑定到 `0.0.0.0`：

```bash
# 在 WSL 中
cd capp/backend

# 停止当前服务（Ctrl+C）
# 重新启动
npm start

# 确认输出显示：
# [INFO] c-backend listening on 0.0.0.0:4000
```

## 推荐

使用**方案 2（adb reverse）**，因为：
- ✅ 最简单，无需修改防火墙
- ✅ 已设置，直接可用
- ✅ 利用现有的 Windows localhost 访问

## 当前配置

已设置：
- ✅ `adb reverse tcp:4000 tcp:4000`
- ✅ `mobile/.env` 中使用 `API_BASE_URL=http://localhost:4000`

只需重启应用即可生效！
