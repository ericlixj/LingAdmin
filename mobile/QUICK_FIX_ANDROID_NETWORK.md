# Android 模拟器网络连接快速修复

## 问题

Android 模拟器无法连接到 `http://10.0.2.2:4000`，显示 `ERR_NETWORK` 或 `unexpected end of stream`。

## 快速修复（推荐）

### 方案 1: 使用 adb 端口转发（最简单）

```bash
# 在 WSL 中运行
cd /home/ericl/source_code/workspace_fullstack/LingAdmin

# 设置端口转发
/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe reverse tcp:4000 tcp:4000

# 然后在 mobile/.env 中修改为：
# API_BASE_URL=http://localhost:4000
```

**优点**：
- 最简单，无需修改后端
- 立即生效
- 不需要重启服务

### 方案 2: 重启后端服务

如果后端服务是在修改 `0.0.0.0` 绑定之前启动的，需要重启：

```bash
# 1. 停止当前后端服务（Ctrl+C）

# 2. 重新启动
cd capp/backend
npm start

# 3. 确认输出显示：
# [INFO] c-backend listening on 0.0.0.0:4000
```

### 方案 3: 使用 Windows IP 地址

如果上述方案都不行：

1. **在 Windows PowerShell 中查找 IP**：
   ```powershell
   ipconfig | findstr IPv4
   ```
   例如：`192.168.1.100`

2. **在 mobile/.env 中修改**：
   ```env
   API_BASE_URL=http://192.168.1.100:4000
   ```

3. **重启应用**

### 方案 4: 在 Windows 中运行后端

如果 WSL 网络问题持续：

1. **在 Windows PowerShell 中**：
   ```powershell
   cd capp\backend
   npm start
   ```

2. **Android 模拟器使用 `10.0.2.2:4000` 应该可以正常工作**

## 验证修复

修复后，在 Android 模拟器中：
1. 打开应用
2. 尝试登录
3. 查看控制台日志，应该能看到成功的 API 请求

## 已创建的脚本

运行 `./fix-android-network.sh` 可以自动：
- 检查后端服务状态
- 设置 adb 端口转发
- 提供其他解决方案
