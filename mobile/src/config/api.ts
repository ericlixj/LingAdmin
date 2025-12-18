import {API_BASE_URL, API_TIMEOUT} from '@env';
import {Platform} from 'react-native';

// 根据平台智能选择默认 API 地址
const getDefaultBaseURL = () => {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  
  if (__DEV__) {
    // 开发环境：根据平台选择默认地址
    if (Platform.OS === 'android') {
      // Android 模拟器需要使用 10.0.2.2 访问宿主机
      return 'http://10.0.2.2:4000';
    } else if (Platform.OS === 'ios') {
      // iOS 模拟器可以使用 localhost
      return 'http://localhost:4000';
    }
    return 'http://localhost:4000';
  }
  
  // 生产环境
  return 'https://your-production-api.com';
};

// API 配置
export const API_CONFIG = {
  BASE_URL: getDefaultBaseURL(),
  TIMEOUT: API_TIMEOUT ? parseInt(API_TIMEOUT, 10) : 30000,
};

// API 端点
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/api/c/auth/login',
    REGISTER: '/api/c/auth/register',
    ME: '/api/c/auth/me',
    VERIFY_EMAIL: '/api/c/auth/verify-email',
  },
  // 传单详情
  FLYER_DETAILS: '/api/c/flyer_details',
  // 加油站
  GAS: '/api/c/gas',
  // 邮编管理
  POSTCODE: '/api/c/postcode',
};

