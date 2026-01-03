# 生产环境数据导入脚本使用说明

## 功能概述

此脚本用于将测试环境的数据导入到生产环境，包括：
1. **章节数据**（12条，source_id=2）
2. **知识点数据**（177条items）
3. **题目数据**（exam_id=4）
4. **题目与知识点的关联**

## 重要特性

- ✅ **避免ID冲突**：使用业务字段匹配，不依赖ID
- ✅ **幂等性**：可以重复运行，已存在的数据会跳过
- ✅ **自动映射**：自动建立测试环境与生产环境的ID映射关系

## 配置参数

脚本中的关键参数（在 `import_to_production.py` 中）：

```python
SOURCE_ID_TEST = 730  # 测试环境的 source_id
SOURCE_ID_PROD = 2    # 生产环境的 source_id
EXAM_ID_TEST = 6      # 测试环境的 exam_id
EXAM_ID_PROD = 4      # 生产环境的 exam_id
CREATOR = "system"    # 创建人
```

## 使用步骤

### 1. 确认环境配置

确保 `.env` 文件中的数据库配置指向**生产环境**：

```bash
POSTGRES_SERVER=生产环境数据库地址
POSTGRES_PORT=5432
POSTGRES_USER=数据库用户名
POSTGRES_PASSWORD=数据库密码
POSTGRES_DB=数据库名
```

### 2. 确认前置条件

- ✅ `study_exam` 表中已有 `exam_id=4` 的记录
- ✅ `study_knowledge_source` 表中已有 `source_id=2` 的记录

### 3. 运行脚本

```bash
cd admin/backend
source .venv/bin/activate
python app/scripts/import_to_production.py
```

## 导入流程

### 步骤 1: 导入章节数据

- 从测试环境读取章节（source_id=730）
- 根据 `source_id + chapter + section` 匹配生产环境
- 如果不存在则创建，已存在则使用现有ID
- 建立测试环境ID到生产环境ID的映射

### 步骤 2: 导入知识点数据

- 从测试环境读取知识点（exam_id=6）
- 根据知识点与章节的关联，找到对应的生产环境章节
- 根据 `title` 匹配生产环境知识点
- 如果不存在则创建，并建立知识点与章节的关联
- 已存在则使用现有ID

### 步骤 3: 导入题目数据

- 从测试环境读取题目（exam_id=6）
- 根据 `exam_id + stem` 匹配生产环境
- 如果不存在则创建（exam_id=4），已存在则跳过

### 步骤 4: 建立题目与知识点的关联

- 从题目的 `stem` 中提取知识点名称（例如："Which of the following correctly describes Axes?" → "Axes"）
- 根据知识点名称匹配生产环境的知识点
- 创建题目与知识点的关联记录

## 日志输出

脚本会输出详细的日志信息，包括：
- 每个步骤的进度
- 创建/已存在的数据统计
- 警告信息（如找不到映射的数据）

## 注意事项

1. **数据库连接**：确保脚本连接到生产环境数据库
2. **数据备份**：建议在运行前备份生产环境数据库
3. **重复运行**：脚本支持重复运行，已存在的数据会跳过
4. **ID映射**：脚本会自动处理ID映射，无需手动干预

## 验证导入结果

导入完成后，可以运行以下SQL验证：

```sql
-- 检查章节数量（应该是12条）
SELECT COUNT(*) FROM study_source_section 
WHERE source_id = 2 AND deleted = false;

-- 检查知识点数量（应该是177条左右）
SELECT COUNT(*) FROM study_knowledge_node 
WHERE deleted = false;

-- 检查题目数量
SELECT COUNT(*) FROM study_question 
WHERE exam_id = 4 AND deleted = false;

-- 检查关联数量
SELECT COUNT(*) FROM study_question_knowledge 
WHERE deleted = false;
```

## 故障排查

### 问题：找不到章节映射

**原因**：测试环境的章节在生产环境不存在  
**解决**：检查章节的 `chapter` 和 `section` 字段是否匹配

### 问题：找不到知识点映射

**原因**：题目的题干格式不正确，无法提取知识点名称  
**解决**：检查题目的 `stem` 字段格式，应该是 "Which of the following correctly describes {item_name}?"

### 问题：知识点已存在但关联失败

**原因**：知识点名称不匹配  
**解决**：检查测试环境和生产环境的知识点 `title` 是否一致
