-- ============================================================
-- 修复所有表的序列号 - 直接执行版本
-- 功能：将所有有 id 字段的表的序列号更新为 max(id) + 1
-- 用途：解决 duplicate key value violates unique constraint 错误
-- 
-- 使用方法：直接在 psql 控制台中复制粘贴执行
-- ============================================================

DO $$
DECLARE
    r RECORD;
    seq_full_name TEXT;
    seq_name TEXT;
    max_id BIGINT;
    current_seq_val BIGINT;
    sql_stmt TEXT;
BEGIN
    -- 遍历所有有 id 列的表
    FOR r IN 
        SELECT DISTINCT
            t.table_schema,
            t.table_name
        FROM information_schema.tables t
        INNER JOIN information_schema.columns c 
            ON t.table_schema = c.table_schema 
            AND t.table_name = c.table_name
        WHERE t.table_schema = 'public'
            AND t.table_type = 'BASE TABLE'
            AND c.column_name = 'id'
            AND c.data_type IN ('integer', 'bigint', 'smallint')
        ORDER BY t.table_name
    LOOP
        -- 使用 pg_get_serial_sequence 查找序列（最可靠的方法）
        seq_full_name := pg_get_serial_sequence(r.table_schema || '.' || r.table_name, 'id');
        
        IF seq_full_name IS NOT NULL THEN
            -- 提取序列名（去掉 schema 前缀）
            seq_name := substring(seq_full_name from '[^.]+$');
            
            -- 获取表中的最大 id 值
            sql_stmt := format('SELECT COALESCE(MAX(id), 0) FROM %I.%I', r.table_schema, r.table_name);
            EXECUTE sql_stmt INTO max_id;
            
            -- 获取序列的当前值
            sql_stmt := format('SELECT last_value FROM %I', seq_name);
            EXECUTE sql_stmt INTO current_seq_val;
            
            -- 只有当 max_id 大于等于当前序列值时才更新
            IF max_id >= current_seq_val THEN
                -- 更新序列的当前值为 max_id + 1
                sql_stmt := format('SELECT setval(%L, %s, true)', seq_name, GREATEST(max_id + 1, 1));
                EXECUTE sql_stmt;
                
                RAISE NOTICE '表 %: 序列 % 从 % 更新为 %', 
                    r.table_name, seq_name, current_seq_val, max_id + 1;
            ELSE
                RAISE NOTICE '表 %: 序列 % 当前值 % 已足够，无需更新 (max_id: %)', 
                    r.table_name, seq_name, current_seq_val, max_id;
            END IF;
        ELSE
            -- 如果没有找到序列，尝试标准命名规则
            seq_name := r.table_name || '_id_seq';
            
            -- 检查序列是否存在
            IF EXISTS (
                SELECT 1 
                FROM pg_class 
                WHERE relname = seq_name 
                AND relkind = 'S'
            ) THEN
                -- 获取表中的最大 id 值
                sql_stmt := format('SELECT COALESCE(MAX(id), 0) FROM %I.%I', r.table_schema, r.table_name);
                EXECUTE sql_stmt INTO max_id;
                
                -- 获取序列的当前值
                sql_stmt := format('SELECT last_value FROM %I', seq_name);
                EXECUTE sql_stmt INTO current_seq_val;
                
                IF max_id >= current_seq_val THEN
                    sql_stmt := format('SELECT setval(%L, %s, true)', seq_name, GREATEST(max_id + 1, 1));
                    EXECUTE sql_stmt;
                    
                    RAISE NOTICE '表 %: 序列 % 从 % 更新为 %', 
                        r.table_name, seq_name, current_seq_val, max_id + 1;
                ELSE
                    RAISE NOTICE '表 %: 序列 % 当前值 % 已足够，无需更新 (max_id: %)', 
                        r.table_name, seq_name, current_seq_val, max_id;
                END IF;
            ELSE
                RAISE NOTICE '表 %: 未找到序列，跳过', r.table_name;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE '序列修复完成！';
END $$;

