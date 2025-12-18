# 数据格式问题修复指南

## 问题

查询数据时，API 返回了数据，但页面没有展示。这通常是因为 API 返回的数据格式与代码期望的格式不匹配。

## 已完成的修复

### 1. 添加了详细的调试日志

在所有数据查询屏幕中添加了调试日志，会在控制台显示：
- API 响应的完整结构
- 数据类型（数组/对象）
- 数据解析结果

### 2. 改进了数据解析逻辑

现在代码可以处理多种数据格式：

#### 格式 1：直接数组（期望格式）
```json
{
  "code": 0,
  "message": "ok",
  "data": [...]
}
```

#### 格式 2：对象包含数组
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "stations": [...],
    "total": 10
  }
}
```

#### 格式 3：嵌套对象
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "data": [...]
  }
}
```

## 如何调试

### 1. 查看控制台日志

在开发模式下，所有数据查询都会在控制台输出详细信息：

```
🔍 [GasStations Response] {
  code: 0,
  message: "ok",
  dataType: "object",
  isArray: false,
  dataKeys: ["stations", "location", "trends"],
  ...
}
```

### 2. 检查数据格式

根据日志中的 `dataType` 和 `dataKeys`，可以判断：
- 如果 `isArray: false`，说明 `data` 是对象，不是数组
- `dataKeys` 显示对象中包含哪些字段

### 3. 查看解析结果

```
✅ [GasStations Parsed] {
  stationsCount: 5,
  firstStation: {...}
}
```

如果 `stationsCount: 0` 但 API 返回了数据，说明数据格式不匹配。

## 常见问题

### Q: 为什么有数据但不显示？

A: 可能的原因：
1. **数据格式不匹配**：API 返回的是对象，但代码期望数组
2. **数据嵌套层级不对**：数据在 `data.stations` 而不是 `data`
3. **字段名不匹配**：API 返回的字段名与代码期望的不同

### Q: 如何查看实际的 API 响应？

A: 查看控制台日志，会显示完整的响应结构。或者：
1. 在 `api.ts` 的响应拦截器中查看日志
2. 使用网络调试工具（如 React Native Debugger）
3. 在浏览器中直接测试 API

### Q: 如何修复数据格式问题？

A: 根据控制台日志，确定实际的数据格式，然后：

1. **如果数据在 `data.stations`**：
   - 代码已经自动处理这种情况
   - 如果还是不行，检查字段名是否正确

2. **如果数据格式完全不同**：
   - 查看控制台日志中的 `fullResponse`
   - 根据实际格式修改服务文件中的接口定义

### Q: 如何临时查看原始响应？

A: 在服务文件中添加日志：

```typescript
async getGasStations(params: GasStationParams): Promise<GasStationsResponse> {
  const response = await api.get<GasStationsResponse>(API_ENDPOINTS.GAS, params);
  console.log('🔍 Raw Response:', JSON.stringify(response, null, 2));
  return response;
}
```

## 已修复的屏幕

1. ✅ **GasStationsScreen** - 加油站查询
2. ✅ **FlyerDetailsScreen** - 传单详情
3. ✅ **PostcodeManagerScreen** - 邮编管理

## 下一步

1. **运行应用并查看控制台**
   - 执行数据查询操作
   - 查看控制台中的调试日志

2. **根据日志调整**
   - 如果日志显示数据格式不匹配
   - 根据实际格式修改代码

3. **如果问题仍然存在**
   - 复制控制台中的完整响应日志
   - 根据实际格式进一步调整解析逻辑

## 示例：修复加油站数据格式

假设 API 返回：
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "stations": [
      {"id": 1, "name": "Shell", ...}
    ]
  }
}
```

代码会自动检测到 `data.stations` 并正确解析。

## 提示

- 所有调试日志只在开发模式（`__DEV__ = true`）下显示
- 生产环境不会显示详细日志
- 如果数据格式经常变化，可以考虑在服务层统一处理数据格式转换


