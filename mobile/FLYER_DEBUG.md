# 传单数据调试指南

## 问题

传单数据仍然为空。

## 已添加的调试功能

### 1. API 响应拦截器日志

在 API 服务层添加了详细的原始响应日志：
```
✅ [API Response Raw] {
  status: 200,
  url: "/api/c/flyer_details",
  dataType: "object",
  isArray: false,
  hasCode: true,
  dataKeys: ["code", "message", "data", "total", ...],
  dataSample: [...]
}
```

### 2. API GET 请求日志

在 GET 请求处理中添加了日志：
```
📥 [API GET Response] {
  url: "/api/c/flyer_details",
  dataType: "object",
  isArray: false,
  hasCode: true,
  dataKeys: [...]
}
```

### 3. 传单详情响应日志

在传单详情屏幕中添加了完整响应日志：
```
🔍 [FlyerDetails Response] {
  code: 0,
  dataType: "object",
  isArray: true/false,
  dataLength: 10,
  fullResponse: "{完整JSON响应}"
}
```

## 调试步骤

### 步骤 1：查看原始 API 响应

在控制台查找 `✅ [API Response Raw]` 日志，检查：
- `dataType`: 应该是 "object"
- `hasCode`: 应该是 true（表示响应有 code 字段）
- `dataKeys`: 应该包含 `["code", "message", "data", ...]`
- `dataSample`: 查看数据样本

### 步骤 2：查看 GET 请求处理

查找 `📥 [API GET Response]` 日志，检查：
- 响应是否已经是标准格式
- 是否需要标准化

### 步骤 3：查看传单详情响应

查找 `🔍 [FlyerDetails Response]` 日志，检查：
- `code`: 应该是 0
- `isArray`: `response.data` 是否是数组
- `dataLength`: 数组长度
- `fullResponse`: 完整的 JSON 响应（前1000字符）

### 步骤 4：查看数据解析结果

查找 `✅ [FlyerDetails Parsed]` 日志，检查：
- `itemsCount`: 解析后的数据数量
- `firstItem`: 第一条数据的内容
- `allItems`: 所有解析后的数据

## 常见问题诊断

### 问题 1：`isArray: false` 且 `dataLength: null`

**原因**：`response.data` 不是数组，而是对象

**解决方案**：
查看 `fullResponse` 中的实际数据结构，可能格式是：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [...]
  }
}
```

代码会自动处理这种情况，但如果字段名不是 `items`、`results` 或 `data`，可能需要调整。

### 问题 2：`itemsCount: 0` 但 API 返回了数据

**原因**：数据提取失败

**解决方案**：
1. 查看 `fullResponse` 了解实际的数据结构
2. 检查 `dataKeys` 看看有哪些字段
3. 可能需要调整 `getDataArray` 的字段名参数

### 问题 3：`code: 0` 但 `data` 为空数组

**原因**：API 确实没有返回数据（可能是搜索条件不匹配）

**解决方案**：
1. 检查搜索条件（关键词、邮编、语言）
2. 尝试不同的搜索条件
3. 确认后端 API 是否正常工作

### 问题 4：响应格式不正确

**原因**：API 返回的格式与预期不符

**解决方案**：
查看 `fullResponse`，根据实际格式调整代码。

## 需要提供的信息

如果问题仍然存在，请提供：

1. **完整的控制台日志**（按顺序）：
   - `✅ [API Response Raw]`
   - `📥 [API GET Response]`
   - `🔍 [FlyerDetails Response]`
   - `✅ [FlyerDetails Parsed]`

2. **搜索条件**：
   - 关键词（如果有）
   - 选择的邮编
   - 选择的语言

3. **API 响应**（如果可能）：
   - 完整的 JSON 响应

## 快速检查清单

- [ ] 查看 `✅ [API Response Raw]` 日志
- [ ] 检查 `hasCode` 是否为 true
- [ ] 检查 `dataKeys` 是否包含 "data"
- [ ] 查看 `🔍 [FlyerDetails Response]` 日志
- [ ] 检查 `isArray` 的值
- [ ] 检查 `dataLength` 的值
- [ ] 查看 `fullResponse` 了解实际结构
- [ ] 检查 `✅ [FlyerDetails Parsed]` 中的 `itemsCount`

## 临时解决方案

如果数据确实返回了但格式不匹配，可以临时在 `FlyerDetailsScreen.tsx` 中手动处理：

```typescript
// 在 searchFlyers 函数中，response.code === 0 之后
if (response.code === 0) {
  let newData: FlyerItem[] = [];
  
  // 根据实际格式手动提取
  if (Array.isArray(response.data)) {
    newData = response.data;
  } else if (response.data?.items && Array.isArray(response.data.items)) {
    newData = response.data.items;
  } else if (response.data?.results && Array.isArray(response.data.results)) {
    newData = response.data.results;
  }
  // ... 其他处理
}
```

但更好的方法是根据 `fullResponse` 的实际格式，调整 `getDataArray` 的调用参数。


