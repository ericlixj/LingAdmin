// utils/db.js
const { Pool } = require('pg');

// PostgreSQL 配置
// 注意：.env 文件已在 index.js 中加载，这里直接使用环境变量
const password = process.env.POSTGRES_PASSWORD ? String(process.env.POSTGRES_PASSWORD) : '';

// 调试：打印数据库配置信息（密码仅显示长度）
if (process.env.NODE_ENV !== 'production') {
  console.log('[DEBUG] Database Connection Config:', {
    host: process.env.POSTGRES_SERVER || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'lingadmin',
    user: process.env.POSTGRES_USER || 'postgres',
    password: password ? `[${password.length} chars]` : '(empty)'
  });
}

const pool = new Pool({
  host: process.env.POSTGRES_SERVER || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'lingadmin',
  user: process.env.POSTGRES_USER || 'postgres',
  password: password || '', // 如果为空字符串，pg 可能不接受，但至少确保是字符串
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试连接
pool.on('connect', () => {
  console.log('[INFO] PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('[ERROR] Unexpected PostgreSQL error:', err);
  console.error('[ERROR] Error details:', {
    message: err.message,
    code: err.code
  });
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
