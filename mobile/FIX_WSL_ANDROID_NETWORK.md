# 修复 WSL + Android Studio 模拟器网络连接

## 问题分析

你的环境：
- ✅ **后端服务**：在 WSL 中运行（`localhost:4000`）
- ✅ **Android 模拟器**：在 Windows 中运行（通过 Android Studio Device Manager 启动）
- ❌ **问题**：`10.0.2.2` 指向 Windows 的 localhost，但服务在 WSL 中

## 网络架构

```
┌─────────────────────────────────────┐
│  Windows 系统                        │
│  ┌───────────────────────────────┐   │
│  │ Android 模拟器                 │   │
│  │ 10.0.2.2 → Windows localhost  │   │
│  └───────────────────────────────┘   │
│  localhost:4000 (Windows)            │
└─────────────────────────────────────┘
              ↓ 需要桥接
┌─────────────────────────────────────┐
│  WSL 系统                            │
│  localhost:4000 (后端服务)           │
└─────────────────────────────────────┘
```

## 解决方案

### 方案 1: 使用 adb reverse（最简单，已设置）✅

```bash
# 在 WSL 中运行（已执行）
adb reverse tcp:4000 tcp:4000

# 然后在 mobile/.env 中使用：
API_BASE_URL=http://localhost:4000
```

**工作原理**：
- Android 模拟器访问 `localhost:4000`
- adb 转发到 Windows 的 `localhost:4000`
- Windows 的 `localhost:4000` 需要转发到 WSL

### 方案 2: Windows 端口转发到 WSL（推荐）

在 **Windows PowerShell（管理员权限）** 中运行：

```powershell
# 1. 获取 WSL IP 地址（在 WSL 中运行：wsl hostname -I）
# 例如：172.31.71.168

# 2. 设置端口转发（替换 <WSL_IP> 为实际的 WSL IP）
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=172.31.71.168

# 3. 查看端口转发规则
netsh interface portproxy show all

# 4. 允许 Windows 防火墙（如果需要）
New-NetFirewallRule -DisplayName "WSL Backend Port 4000" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow
```

然后 Android 模拟器使用：
```env
API_BASE_URL=http://10.0.2.2:4000
```

### 方案 3: 在 Windows 中运行后端（最简单）

如果 WSL 网络配置复杂，可以在 Windows 中直接运行后端：

1. **在 Windows PowerShell 中**：
   ```powershell
   cd capp\backend
   npm start
   ```

2. **Android 模拟器使用**：
   ```env
   API_BASE_URL=http://10.0.2.2:4000
   ```

这样 `10.0.2.2` 直接指向 Windows 的 localhost，可以正常工作。

### 方案 4: 使用 WSL IP 地址

1. **获取 WSL IP**（在 WSL 中）：
   ```bash
   hostname -I
   # 例如：172.31.71.168
   ```

2. **在 mobile/.env 中**：
   ```env
   API_BASE_URL=http://172.31.71.168:4000
   ```

**注意**：WSL IP 可能会变化，每次 WSL 重启后需要更新。

## 推荐方案

### 对于开发：方案 2（Windows 端口转发）

优点：
- 一次配置，长期有效
- Android 模拟器可以使用标准的 `10.0.2.2`
- 不需要修改代码

### 对于快速测试：方案 3（Windows 中运行后端）

优点：
- 最简单，无需配置
- 直接可用

## 验证修复

修复后，在 Android 模拟器中：
1. 打开应用
2. 尝试登录
3. 查看控制台，应该能看到成功的 API 请求

## 已创建的脚本

运行 `./fix-android-network.sh` 可以：
- 检查后端服务状态
- 设置 adb 端口转发
- 提供其他解决方案
