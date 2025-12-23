-- ============================================================
-- 获取完全重复题目的 ID 集合（需要删除的）
-- 
-- 说明：
-- 对于完全重复的题目（题干+选项+答案都相同），
-- 返回每组重复中除了 ID 最小的之外的所有 ID
-- ============================================================

-- 方法1：返回需要删除的 ID 数组（推荐）
SELECT array_agg(id ORDER BY id) as delete_ids
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
WHERE rn > 1;  -- 保留第一个（ID最小的），返回其他的

-- ============================================================
-- 方法2：返回所有需要删除的 ID 列表（每行一个 ID）
-- ============================================================

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
WHERE rn > 1
ORDER BY id;

-- ============================================================
-- 方法3：返回需要删除的 ID 列表（逗号分隔，可直接用于 IN 子句）
-- ============================================================

SELECT string_agg(id::text, ', ' ORDER BY id) as delete_ids
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
WHERE rn > 1;

-- ============================================================
-- 方法4：直接执行删除的 SQL（如果需要）
-- ============================================================

-- UPDATE study_question
-- SET deleted = true, update_time = CURRENT_TIMESTAMP
-- WHERE id IN (
--     SELECT id
--     FROM (
--         SELECT 
--             id,
--             ROW_NUMBER() OVER (
--                 PARTITION BY 
--                     COALESCE(stem, ''),
--                     COALESCE(options, ''),
--                     COALESCE(answer, '')
--                 ORDER BY id ASC
--             ) as rn
--         FROM study_question
--         WHERE deleted = false
--     ) ranked
--     WHERE rn > 1
-- );
