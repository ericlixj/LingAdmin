# Android 网络连接修复

## 问题

在 Android 模拟器中，使用 `localhost` 无法访问宿主机（运行后端服务的电脑），因为 `localhost` 在模拟器中指向的是模拟器本身。

## 解决方案

### ✅ 已修复

1. **更新了 `.env` 文件**：将 `API_BASE_URL` 从 `http://localhost:4000` 改为 `http://10.0.2.2:4000`

2. **改进了 API 配置**：现在会根据平台智能选择默认地址：
   - **Android 模拟器**：自动使用 `http://10.0.2.2:4000`
   - **iOS 模拟器**：使用 `http://localhost:4000`
   - **真机**：需要在 `.env` 中配置电脑的 IP 地址

## 不同环境的 API 地址配置

### Android 模拟器 ✅
```env
API_BASE_URL=http://10.0.2.2:4000
```
`10.0.2.2` 是 Android 模拟器访问宿主机的特殊 IP 地址。

### iOS 模拟器
```env
API_BASE_URL=http://localhost:4000
```
iOS 模拟器可以直接使用 `localhost`。

### 真机（Android/iOS）
```env
API_BASE_URL=http://192.168.1.100:4000
```
需要将 `192.168.1.100` 替换为您电脑的实际 IP 地址。

**如何查找电脑 IP 地址**：
- **Windows**: 运行 `ipconfig`，查找 IPv4 地址
- **Mac/Linux**: 运行 `ifconfig` 或 `ip addr`，查找局域网 IP

## 验证修复

1. **重启 Metro bundler**：
   ```bash
   # 停止当前进程 (Ctrl+C)
   npm start
   ```

2. **重新运行应用**：
   ```bash
   # Android
   npm run android
   # 或
   npx expo run:android
   ```

3. **查看调试信息**：
   - 登录页面会显示当前使用的 API 地址
   - 控制台会显示详细的网络请求日志

4. **测试登录**：
   - 尝试登录
   - 查看控制台日志，确认请求 URL 是 `http://10.0.2.2:4000/api/c/auth/login`

## 常见问题

### Q: 为什么 Android 模拟器不能使用 localhost？

A: Android 模拟器是一个独立的虚拟设备，它的 `localhost` 指向的是模拟器本身，而不是运行 Metro bundler 的宿主机。`10.0.2.2` 是 Android 模拟器专门用来访问宿主机的特殊 IP 地址。

### Q: 如何确认修复是否生效？

A: 
1. 查看登录页面顶部的调试信息，应该显示 `API: http://10.0.2.2:4000`
2. 查看控制台日志，网络请求的 `baseURL` 应该是 `http://10.0.2.2:4000`
3. 尝试登录，如果之前是网络错误，现在应该能正常连接

### Q: 如果还是连接不上怎么办？

A: 检查以下几点：
1. **后端服务是否运行**：在浏览器访问 `http://localhost:4000/api/c/health` 确认
2. **端口是否正确**：确认后端服务运行在 4000 端口
3. **防火墙设置**：确保防火墙没有阻止 4000 端口
4. **查看详细错误**：查看控制台的 `❌ [API Network Error]` 日志

## 下一步

现在可以：
1. 重启应用
2. 尝试登录
3. 查看控制台日志确认连接成功

如果还有问题，请查看 `DEBUG_NETWORK.md` 获取更详细的调试指南。

