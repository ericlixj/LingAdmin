# 图片代理功能调试指南

## 功能说明

答题页面（PracticePage 和 ExamPage）已集成图片代理功能，用于绕过防盗链限制。

## 验证步骤

### 1. 检查浏览器控制台

打开答题页面后，在浏览器控制台（F12）中应该能看到以下日志：

```
[ImageProxy] 原始URL: https://static.wikia.nocookie.net/...
[ImageProxy] 代理URL: http://localhost:4000/api/v1/imageProxy/proxy?url=...
[PracticePage] 原始图片URL: https://static.wikia.nocookie.net/...
[PracticePage] 代理后URL: http://localhost:4000/api/v1/imageProxy/proxy?url=...
```

### 2. 检查网络请求

在浏览器开发者工具的 Network 标签中：
1. 刷新答题页面
2. 查找包含 `imageProxy/proxy` 的请求
3. 检查请求状态码：
   - 200: 成功
   - 404: 后端路由未注册或路径错误
   - 502: 后端无法获取原始图片

### 3. 手动测试代理API

在浏览器控制台或使用 curl 测试：

```javascript
// 在浏览器控制台测试
const testUrl = 'https://static.wikia.nocookie.net/99-nights-in-the-forest/images/d/df/Old_axe.png';
const API_URL = 'http://localhost:4000'; // 或你的实际API地址
const proxyUrl = `${API_URL}/api/v1/imageProxy/proxy?url=${encodeURIComponent(testUrl)}`;
console.log('代理URL:', proxyUrl);

// 测试加载
const img = new Image();
img.onload = () => console.log('✅ 图片加载成功');
img.onerror = () => console.error('❌ 图片加载失败');
img.src = proxyUrl;
```

### 4. 常见问题排查

#### 问题1: 图片不显示
- **检查**: 浏览器控制台是否有错误
- **检查**: Network 标签中图片请求的状态
- **检查**: 图片URL是否为空

#### 问题2: 代理API返回404
- **检查**: 后端服务是否运行
- **检查**: 路由是否正确注册（应该看到 "loading module app.api.routes.imageProxy success!"）
- **检查**: API路径是否正确（应该是 `/api/v1/imageProxy/proxy`）

#### 问题3: 代理API返回502
- **检查**: 原始图片URL是否可访问
- **检查**: 后端日志中的错误信息
- **可能原因**: 原始网站的反爬虫机制

### 5. 代码位置

- **工具函数**: `capp/frontend/src/utils/imageProxy.js`
- **练习页面**: `capp/frontend/src/PracticePage.jsx` (第1449行)
- **考试页面**: `capp/frontend/src/ExamPage.jsx` (第778行)
- **后端API**: `admin/backend/app/api/routes/imageProxy.py`

### 6. 调试技巧

1. **查看实际生成的URL**: 在控制台查看 `[ImageProxy]` 日志
2. **检查图片元素**: 在 Elements 标签中查看 `<img>` 标签的 `src` 属性
3. **网络请求详情**: 在 Network 标签中查看请求的 Headers 和 Response

## 预期行为

1. 外部图片URL（http/https）→ 自动通过代理
2. 相对路径（/path/to/image）→ 直接使用
3. data URL → 直接使用
4. 代理失败 → 自动回退到原始URL
