# 邮编统一管理

## 概述

已将所有模块的邮编管理统一到邮编管理模块，传单和加油站模块不再单独维护邮编信息。

## 已完成的修改

### 1. 创建了共享的邮编管理 Hook

**文件**: `src/hooks/usePostcodes.ts`

提供统一的邮编数据管理：
- 自动加载邮编列表
- 提供刷新功能
- 统一的错误处理

### 2. 创建了邮编选择器组件

**文件**: `src/components/PostcodePicker.tsx`

可复用的邮编选择器组件：
- 下拉选择器界面
- 显示邮编和标签
- 支持空状态提示
- 自动从邮编管理模块获取数据

### 3. 更新了传单详情屏幕

**文件**: `src/screens/main/FlyerDetailsScreen.tsx`

修改内容：
- ✅ 移除了邮编输入框
- ✅ 使用 `PostcodePicker` 组件
- ✅ 从邮编管理模块获取邮编列表
- ✅ 移除了邮编格式化逻辑（由组件处理）

### 4. 更新了加油站屏幕

**文件**: `src/screens/main/GasStationsScreen.tsx`

修改内容：
- ✅ 移除了邮编输入框
- ✅ 移除了 AsyncStorage 存储逻辑
- ✅ 使用 `PostcodePicker` 组件
- ✅ 从邮编管理模块获取邮编列表

## 使用方式

### 在屏幕中使用邮编选择器

```typescript
import PostcodePicker from '../../components/PostcodePicker';

// 在组件中
const [selectedPostcode, setSelectedPostcode] = useState('');

<PostcodePicker
  selectedPostcode={selectedPostcode}
  onSelect={setSelectedPostcode}
  placeholder="选择邮编"
/>
```

### 使用邮编管理 Hook

```typescript
import {usePostcodes} from '../hooks/usePostcodes';

const {postcodes, loading, error, refresh} = usePostcodes();
```

## 优势

### 1. 统一管理
- 所有邮编数据统一在邮编管理模块维护
- 避免数据重复和不一致

### 2. 用户体验
- 用户只需在邮编管理中配置一次
- 所有模块自动使用已配置的邮编
- 支持为邮编添加标签，便于识别

### 3. 代码复用
- 邮编选择器组件可在任何地方复用
- 邮编管理 Hook 提供统一的数据访问

### 4. 易于维护
- 邮编逻辑集中管理
- 修改邮编功能只需更新一处

## 工作流程

1. **配置邮编**：用户在"邮编管理"模块中添加邮编
2. **使用邮编**：在"传单详情"或"加油站"模块中选择已配置的邮编
3. **自动同步**：所有模块使用相同的邮编数据源

## 注意事项

1. **首次使用**：如果还没有配置邮编，选择器会提示用户先去邮编管理添加
2. **数据同步**：各模块使用独立的 hook 实例，切换模块时会自动重新加载邮编列表
3. **邮编格式**：邮编选择器会自动处理格式（包括空格），搜索时会自动清理格式

## 未来改进

可以考虑：
1. 使用 Context API 实现全局邮编状态管理，实现实时同步
2. 添加"最近使用的邮编"功能
3. 支持邮编搜索和过滤

## 测试

请测试以下场景：
1. ✅ 在邮编管理中添加邮编
2. ✅ 在传单详情中选择邮编并搜索
3. ✅ 在加油站中选择邮编并搜索
4. ✅ 验证邮编选择器显示正确的邮编和标签
5. ✅ 验证没有配置邮编时的提示信息

