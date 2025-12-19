# Prompts 错误修复指南

## 错误信息

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at ConfirmPrompt._ (/node_modules/prompts/lib/elements/confirm.js:60:11)
```

## 原因

这个错误通常发生在：
1. **非交互式终端**：在 WSL 或某些终端环境中，输入流可能不可用
2. **prompts 库问题**：`prompts` 库尝试读取用户输入时失败
3. **Expo CLI 交互式提示**：Expo 在某些情况下会显示交互式提示

## 解决方案

### ✅ 已应用的修复

1. **添加 `CI=true` 环境变量**
   - 在 `package.json` 的 `start` 脚本中添加
   - 在 `start-android.sh` 脚本中设置
   - 这会告诉 Expo 使用非交互式模式

2. **更新启动命令**
   ```bash
   CI=true npx expo start --go
   ```

### 使用方法

#### 方法 1：使用 npm 脚本（推荐）

```bash
npm start
```

#### 方法 2：使用启动脚本

```bash
./start-android.sh
```

#### 方法 3：手动设置环境变量

```bash
export CI=true
npx expo start --go
```

## 其他解决方案

### 如果问题仍然存在

#### 方案 1：更新 Expo CLI

```bash
npm install -g expo-cli@latest
```

#### 方案 2：清除缓存

```bash
npm start -- --clear
```

#### 方案 3：使用非交互式标志

```bash
npx expo start --go --non-interactive
```

#### 方案 4：更新 prompts 库

```bash
npm install prompts@latest
```

## 验证

运行后应该：
- ✅ 不再出现 prompts 错误
- ✅ 正常启动 Expo 开发服务器
- ✅ 显示二维码和连接信息
- ✅ 可以按 'a' 键在 Android 中打开

## 技术说明

`CI=true` 环境变量：
- 告诉工具链这是持续集成环境
- 禁用交互式提示
- 使用默认选项
- 避免读取用户输入

这在 WSL 和某些终端环境中特别有用。

## 相关错误

如果遇到类似错误：
- `Cannot read properties of undefined`
- `prompts` 相关错误
- 交互式输入错误

都可以通过设置 `CI=true` 来解决。

