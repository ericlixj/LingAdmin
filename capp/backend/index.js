// capp/backend/index.js
const express = require("express");
const cors = require("cors");
const { searchFlyerDetails } = require("./services/flyerService");

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

// 查询 flyer_details from OpenSearch
app.get("/api/c/flyer_details", async (req, res) => {
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

  console.log(`[INFO] flyer_details search - q: "${queryString}", zipCode: ${zipCodeParam}, lang: ${langParam}, from: ${from}, size: ${size}`);
  
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
