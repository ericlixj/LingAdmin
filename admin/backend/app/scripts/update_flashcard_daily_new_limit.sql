-- 更新 Flashcard 类型学习记录的每日新增数量
-- 将 daily_new_limit 从 30 更新为 10
-- 注意：此更新只影响后续每日新增的题目数量，不会删除已有的 flashcard_progress 记录

-- 查看当前 flashcard 类型的 session 及其 daily_new_limit
SELECT 
    id,
    user_id,
    exam_id,
    mode,
    daily_new_limit,
    create_time
FROM study_session
WHERE mode = 'flashcard' 
  AND deleted = false
ORDER BY id;

-- 更新所有 flashcard 类型的 session，将 daily_new_limit 从 30 改为 10
-- 如果只想更新特定条件的记录，可以添加 WHERE 条件
UPDATE study_session
SET 
    daily_new_limit = 10,
    update_time = CURRENT_TIMESTAMP
WHERE mode = 'flashcard'
  AND deleted = false
  AND daily_new_limit = 30;  -- 只更新当前值为 30 的记录

-- 验证更新结果
SELECT 
    id,
    user_id,
    exam_id,
    mode,
    daily_new_limit,
    update_time
FROM study_session
WHERE mode = 'flashcard' 
  AND deleted = false
ORDER BY id;
