// capp/backend/routes/imageProxy.js
// 图片代理路由，用于绕过防盗链
const express = require("express");
const router = express.Router();
const https = require("https");
const http = require("http");
const { URL } = require("url");

/**
 * 代理图片请求，绕过防盗链
 */
router.get("/proxy", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      code: 1,
      message: "缺少url参数",
    });
  }

  try {
    // 验证URL格式
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        code: 1,
        message: "只支持http和https协议",
      });
    }

    // 设置请求头，绕过防盗链
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
    };

    // 选择http或https模块
    const httpModule = parsedUrl.protocol === "https:" ? https : http;

    // 发起请求
    const proxyReq = httpModule.get(url, { headers }, (proxyRes) => {
      // 检查状态码
      if (proxyRes.statusCode !== 200) {
        console.error(
          `[ImageProxy] 图片请求失败: ${url}, 状态码: ${proxyRes.statusCode}`
        );
        if (!res.headersSent) {
          res.status(502).json({
            code: 1,
            message: `无法获取图片: HTTP ${proxyRes.statusCode}`,
          });
        }
        return;
      }

      // 设置响应头
      const contentType = proxyRes.headers["content-type"] || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400"); // 缓存1天
      res.setHeader("Access-Control-Allow-Origin", "*");

      // 流式传输图片数据
      proxyRes.pipe(res);
    });

    // 处理错误
    proxyReq.on("error", (error) => {
      console.error(`[ImageProxy] 代理图片请求失败: ${url}, 错误:`, error);
      if (!res.headersSent) {
        res.status(502).json({
          code: 1,
          message: `无法获取图片: ${error.message}`,
        });
      }
    });

    // 设置超时
    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({
          code: 1,
          message: "请求超时",
        });
      }
    });
  } catch (error) {
    console.error(`[ImageProxy] 代理图片时发生错误: ${url}, 错误:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        code: 1,
        message: `服务器错误: ${error.message}`,
      });
    }
  }
});

module.exports = router;
