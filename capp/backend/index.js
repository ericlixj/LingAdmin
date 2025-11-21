// capp/backend/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { searchFlyerDetails } = require("./services/flyerService");

// 从项目根目录 .env 文件加载环境变量
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  require("dotenv").config({ path: rootEnvPath });
} else {
  // 如果项目根目录 .env 不存在，尝试从 capp/.env 加载（向后兼容）
  const cappEnvPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(cappEnvPath)) {
    require("dotenv").config({ path: cappEnvPath });
  } else {
    require("dotenv").config();
  }
}

// 调试：打印数据库配置信息（仅在非生产环境）
if (process.env.NODE_ENV !== 'production') {
  console.log('[DEBUG] Database Configuration:', {
    POSTGRES_SERVER: process.env.POSTGRES_SERVER,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? `[${process.env.POSTGRES_PASSWORD.length} chars]` : '(not set)'
  });
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const query = JSON.stringify(req.query);
  const body = req.method !== 'GET' ? JSON.stringify(req.body) : '';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  if (query !== '{}') {
    console.log(`  Query: ${query}`);
  }
  if (body) {
    console.log(`  Body: ${body}`);
  }
  
  // 记录响应时间
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`  Response: ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

app.get("/api/c/health", (req, res) => {
  console.log("[INFO] Health check endpoint called");
  res.json({ code: 0, message: "ok", data: { service: "c-backend" } });
});

app.get("/api/c/hello", (req, res) => {
  console.log("[INFO] Hello endpoint called");
  res.json({
    code: 0,
    message: "ok",
    data: {
      greeting: "Hello from 2C backend",
      timestamp: new Date().toISOString()
    }
  });
});

// 添加认证路由（这是缺失的部分！）
const authRouter = require("./routes/auth");
const postcodeRouter = require("./routes/postcode");
const gasRouter = require("./routes/gas");
const { authenticateToken } = require("./utils/jwt");

// 认证路由
app.use("/api/c/auth", authRouter);

// Postcode 维护路由
app.use("/api/c/postcode", postcodeRouter);

// Gas 查询路由
app.use("/api/c/gas", gasRouter);

// 查询 flyer_details from OpenSearch（需要认证）
app.get("/api/c/flyer_details", authenticateToken, async (req, res) => {
  const { 
    q,              // 搜索关键词
    name,           // 别名（向后兼容）
    zip_code,       // 邮编
    zipCode,        // 别名
    lang,           // 语言：en/hk/cn
    _start = 0,     // 起始位置
    _end = 20       // 结束位置
  } = req.query;
  
  // 支持 q 或 name 参数（向后兼容）
  const queryString = q || name || '';
  const from = parseInt(_start, 10);
  const size = parseInt(_end, 10) - from;
  const zipCodeParam = zip_code || zipCode || null;
  const langParam = lang || 'cn';

  console.log(`[INFO] flyer_details search - user: ${req.userId}, q: "${queryString}", zipCode: ${zipCodeParam}, lang: ${langParam}, from: ${from}, size: ${size}`);
  
  try {
    const result = await searchFlyerDetails({
      q: queryString,
      zipCode: zipCodeParam,
      lang: langParam,
      from,
      size
    });
    
    console.log(`[INFO] flyer_details search success - found ${result.total} items, returned ${result.data.length} items`);
    
    res.json({
      code: 0,
      message: "ok",
      data: result.data,
      total: result.total,
      from: result.from,
      size: result.size
    });
  } catch (error) {
    console.error(`[ERROR] flyer_details search failed:`, error);
    res.status(500).json({
      code: 1,
      message: "搜索失败: " + error.message,
      data: []
    });
  }
});

app.listen(PORT, () => {
  console.log(`[INFO] c-backend listening on port ${PORT}`);
});
