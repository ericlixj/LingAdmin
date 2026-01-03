/**
 * 图片代理工具函数
 * 用于绕过防盗链
 */
const VITE_API_URL = import.meta.env.VITE_API_URL;

/**
 * 获取图片代理URL
 * @param imageUrl 原始图片URL
 * @returns 代理URL
 */
export const getProxyImageUrl = (imageUrl: string | null | undefined): string | undefined => {
  if (!imageUrl) {
    return undefined;
  }
  
  // 如果已经是代理URL，直接返回
  if (imageUrl.includes('/api/v1/imageProxy/proxy')) {
    return imageUrl;
  }
  
  // 生成代理URL
  const encodedUrl = encodeURIComponent(imageUrl);
  return `${VITE_API_URL}/api/v1/imageProxy/proxy?url=${encodedUrl}`;
};








