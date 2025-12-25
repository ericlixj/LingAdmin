-- ============================================================
-- 逻辑删除完全重复的题目
-- 
-- 说明：
-- 1. 对于完全重复的题目（题干+选项+答案都相同），保留每组中 ID 最小的
-- 2. 其他重复题目设置为 deleted=true（逻辑删除）
-- 3. 只影响 study_question 表
-- 
-- 使用方法：
--   在 PostgreSQL 数据库中执行此脚本
-- ============================================================

-- ============================================================
-- 第一步：查看重复题目统计（执行前检查）
-- ============================================================

SELECT 
    '执行前统计' as status,
    COUNT(*) as total_questions,
    COUNT(DISTINCT CONCAT(COALESCE(stem, ''), '|||', COALESCE(options, ''), '|||', COALESCE(answer, ''))) as unique_questions,
    COUNT(*) - COUNT(DISTINCT CONCAT(COALESCE(stem, ''), '|||', COALESCE(options, ''), '|||', COALESCE(answer, ''))) as duplicate_count
FROM study_question
WHERE deleted = false;

-- ============================================================
-- 第二步：查看重复题目详情（可选，用于确认）
-- ============================================================

SELECT 
    stem,
    options,
    answer,
    COUNT(*) as count,
    array_agg(id ORDER BY id) as question_ids,
    MIN(id) as keep_id
FROM study_question
WHERE deleted = false
GROUP BY stem, options, answer
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;

-- ============================================================
-- 第三步：执行逻辑删除（使用窗口函数，PostgreSQL 支持）
-- ============================================================

BEGIN;

-- 逻辑删除重复题目（保留每组中 ID 最小的）
UPDATE study_question
SET 
    deleted = true,
    update_time = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    COALESCE(stem, ''),
                    COALESCE(options, ''),
                    COALESCE(answer, '')
                ORDER BY id ASC
            ) as rn
        FROM study_question
        WHERE deleted = false
    ) ranked
    WHERE rn > 1  -- 保留第一个（ID最小的），删除其他的
);

COMMIT;

-- ============================================================
-- 第四步：验证结果（执行后检查）
-- ============================================================

-- 检查是否还有重复
SELECT 
    '执行后检查' as status,
    COUNT(*) as total_active_questions,
    COUNT(DISTINCT CONCAT(COALESCE(stem, ''), '|||', COALESCE(options, ''), '|||', COALESCE(answer, ''))) as unique_questions
FROM study_question
WHERE status = 1;

-- 如果还有重复，显示详情
SELECT 
    stem,
    options,
    answer,
    COUNT(*) as count,
    array_agg(id ORDER BY id) as question_ids
FROM study_question
WHERE status = 1
GROUP BY stem, options, answer
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 查看被禁用的题目数量
SELECT 
    '禁用统计' as status,
    COUNT(*) as disabled_count
FROM study_question
WHERE status = 0;


