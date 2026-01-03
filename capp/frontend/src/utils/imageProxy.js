/**
 * 图片代理工具函数
 * 用于绕过防盗链，通过后端代理服务器获取图片
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * 获取代理图片URL
 * @param {string} originalUrl - 原始图片URL
 * @returns {string} 代理后的图片URL，如果原始URL为空则返回空字符串
 */
export function getProxyImageUrl(originalUrl) {
  if (!originalUrl) {
    return "";
  }

  // 如果已经是代理URL，直接返回
  if (originalUrl.includes("/api/v1/imageProxy/proxy")) {
    return originalUrl;
  }

  // 如果是相对路径或data URL，直接返回
  if (originalUrl.startsWith("/") || originalUrl.startsWith("data:")) {
    return originalUrl;
  }

  // 构建代理URL
  const encodedUrl = encodeURIComponent(originalUrl);
  const proxyUrl = `${API_URL}/api/v1/imageProxy/proxy?url=${encodedUrl}`;
  
  // 调试日志（开发环境）
  if (import.meta.env.DEV) {
    console.log('[ImageProxy] 原始URL:', originalUrl);
    console.log('[ImageProxy] 代理URL:', proxyUrl);
  }
  
  return proxyUrl;
}

/**
 * 检查URL是否需要代理
 * @param {string} url - 图片URL
 * @returns {boolean} 是否需要代理
 */
export function needsProxy(url) {
  if (!url) {
    return false;
  }

  // 相对路径、data URL、已代理的URL不需要代理
  if (
    url.startsWith("/") ||
    url.startsWith("data:") ||
    url.includes("/api/v1/imageProxy/proxy")
  ) {
    return false;
  }

  // 外部URL需要代理
  return url.startsWith("http://") || url.startsWith("https://");
}
