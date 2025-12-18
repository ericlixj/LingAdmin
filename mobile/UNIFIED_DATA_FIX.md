# 统一数据格式修复

## 问题

所有数据查询都有格式问题：API 返回了数据，但页面没有展示。这是因为 API 返回的数据格式与代码期望的格式不匹配。

## 解决方案

### 1. 创建了统一的数据格式转换工具

**文件**: `src/utils/dataFormatter.ts`

提供了以下功能：
- `extractArrayFromResponse()` - 从各种格式的响应中提取数组
- `normalizeApiResponse()` - 标准化 API 响应格式
- `getDataArray()` - 统一的数据数组提取函数
- `getDataObject()` - 统一的数据对象提取函数

### 2. 在 API 服务层统一处理

**文件**: `src/services/api.ts`

所有 API 请求的响应都会自动标准化：
- GET、POST、PATCH、DELETE 请求都会通过 `normalizeApiResponse()` 处理
- 确保所有响应都有统一的格式：`{ code, message, data }`

### 3. 更新了所有屏幕使用统一工具

**已更新的屏幕**：
- ✅ `GasStationsScreen` - 加油站查询
- ✅ `FlyerDetailsScreen` - 传单详情
- ✅ `PostcodeManagerScreen` - 邮编管理

所有屏幕现在都使用 `getDataArray()` 函数来提取数据，不再需要重复的数据格式处理代码。

## 支持的数据格式

工具可以自动处理以下数据格式：

### 格式 1：直接数组（标准格式）
```json
{
  "code": 0,
  "message": "ok",
  "data": [...]
}
```

### 格式 2：对象包含数组
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

### 格式 3：嵌套对象
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "data": [...]
  }
}
```

### 格式 4：其他常见字段名
工具会自动查找以下字段名：
- `data`
- `items`
- `results`
- `stations`
- `postcodes`

## 使用示例

### 在屏幕中使用

```typescript
import {getDataArray} from '../../utils/dataFormatter';

// 在 API 调用后
const response = await gasService.getGasStations(params);

if (response.code === 0) {
  // 使用统一工具提取数据
  const stations = getDataArray<GasStation>(response, ['stations', 'data']);
  setStations(stations);
}
```

### 指定字段名优先级

```typescript
// 优先查找 'stations'，如果没有则查找 'data'
const stations = getDataArray<GasStation>(response, ['stations', 'data']);

// 优先查找 'items'，然后 'results'，最后 'data'
const items = getDataArray<FlyerItem>(response, ['items', 'results', 'data']);
```

## 优势

### 1. 统一处理
- 所有数据格式问题在一个地方解决
- 不需要在每个屏幕中重复处理

### 2. 自动适配
- 自动识别多种数据格式
- 自动查找常见字段名

### 3. 易于维护
- 如果需要支持新的数据格式，只需修改工具函数
- 所有屏幕自动受益

### 4. 调试友好
- 在开发模式下会输出详细的调试日志
- 可以清楚地看到数据提取过程

## 调试

在开发模式下，工具会输出详细的调试日志：

```
📦 [DataFormatter] Found array in field: stations
✅ [DataFormatter] Extracted array: {
  originalDataType: "object",
  extractedLength: 5,
  firstItem: {...}
}
```

## 已修复的问题

1. ✅ **加油站查询** - 现在可以正确显示数据
2. ✅ **传单详情** - 现在可以正确显示数据
3. ✅ **邮编管理** - 现在可以正确显示数据
4. ✅ **所有未来添加的屏幕** - 自动支持统一的数据格式处理

## 注意事项

1. **字段名优先级**：如果 API 返回的数据在特定字段中，需要在调用 `getDataArray()` 时指定字段名
2. **类型安全**：使用 TypeScript 泛型确保类型安全
3. **空数据处理**：如果数据为空或格式不匹配，会返回空数组而不是抛出错误

## 未来扩展

如果需要支持新的数据格式，只需在 `dataFormatter.ts` 中扩展 `extractArrayFromResponse()` 函数即可。

## 测试

运行应用并测试所有数据查询功能：
1. 加油站查询
2. 传单详情搜索
3. 邮编管理

所有功能现在都应该能正确显示数据了。


