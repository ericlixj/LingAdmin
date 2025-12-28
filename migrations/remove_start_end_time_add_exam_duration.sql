-- 迁移脚本：删除 study_session 表的 start_time 和 end_time 字段，添加 exam_duration 字段
-- 执行时间：2025-12-26

-- 1. 添加 exam_duration 字段到 study_exam 表（考试时长，单位：分钟）
ALTER TABLE study_exam 
ADD COLUMN IF NOT EXISTS exam_duration INTEGER DEFAULT 60;

COMMENT ON COLUMN study_exam.exam_duration IS '考试时长（分钟）';

-- 2. 添加 exam_duration 字段到 study_session 表（从 study_exam 继承，或单独设置）
ALTER TABLE study_session 
ADD COLUMN IF NOT EXISTS exam_duration INTEGER;

COMMENT ON COLUMN study_session.exam_duration IS '考试时长（分钟），从 study_exam 继承或单独设置';

-- 3. 删除 study_session 表的 start_time 和 end_time 字段
ALTER TABLE study_session 
DROP COLUMN IF EXISTS start_time;

ALTER TABLE study_session 
DROP COLUMN IF EXISTS end_time;

-- 4. 如果 study_exam 表中已有数据，设置默认考试时长为 60 分钟
UPDATE study_exam 
SET exam_duration = 60 
WHERE exam_duration IS NULL;

-- 5. 如果 study_session 表中已有考试记录，从关联的 study_exam 表继承 exam_duration
UPDATE study_session ss
SET exam_duration = se.exam_duration
FROM study_exam se
WHERE ss.exam_id = se.id 
  AND ss.exam_duration IS NULL 
  AND se.exam_duration IS NOT NULL;

-- 6. 对于没有关联 exam_id 的 study_session，设置默认值为 60 分钟
UPDATE study_session 
SET exam_duration = 60 
WHERE exam_duration IS NULL;

