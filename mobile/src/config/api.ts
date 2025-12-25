import {API_BASE_URL, API_BASE_URL_IOS, API_BASE_URL_ANDROID, API_TIMEOUT} from '@env';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Environment, getEnvironmentConfig, ENVIRONMENTS, getAllEnvironments} from './environments';

const ENVIRONMENT_STORAGE_KEY = 'app_environment';

// 根据平台智能选择默认 API 地址
const getDefaultBaseURL = () => {
  // 优先使用平台特定的环境变量
  if (Platform.OS === 'ios' && API_BASE_URL_IOS) {
    return API_BASE_URL_IOS;
  }
  if (Platform.OS === 'android' && API_BASE_URL_ANDROID) {
    return API_BASE_URL_ANDROID;
  }
  
  // 其次使用通用的 API_BASE_URL
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
  
  // 生产环境：默认使用生产 API
  // 如果需要在生产环境也使用平台特定的地址，可以在 EAS 构建配置中设置
  return 'https://c-api.kxf.ca';
};

// 获取当前环境配置的 API 地址
let cachedEnvironment: Environment | null = null;
let cachedBaseUrl: string | null = null;

/**
 * 清除缓存（当环境切换时调用）
 */
export function clearApiBaseUrlCache() {
  cachedEnvironment = null;
  cachedBaseUrl = null;
}

/**
 * 获取当前环境的 API 基础地址
 * 优先使用用户选择的环境，其次使用编译时的环境变量
 */
export async function getCurrentApiBaseUrl(): Promise<string> {
  try {
    // 尝试从存储中获取用户选择的环境
    const savedEnv = await AsyncStorage.getItem(ENVIRONMENT_STORAGE_KEY);
    const validEnvironments = getAllEnvironments();
    
    // 如果保存的是旧的 'preview' 环境，迁移到 'production'
    let envToUse: Environment | null = null;
    if (savedEnv) {
      if (savedEnv === 'preview') {
        // 迁移旧的预览环境到生产环境
        envToUse = 'production';
        await AsyncStorage.setItem(ENVIRONMENT_STORAGE_KEY, 'production');
      } else if (validEnvironments.includes(savedEnv as Environment)) {
        envToUse = savedEnv as Environment;
      }
    }
    
    if (envToUse) {
      const env = envToUse;
      // 如果环境变化或缓存为空，更新缓存
      if (env !== cachedEnvironment || !cachedBaseUrl) {
        cachedEnvironment = env;
        // 使用 getEnvironmentConfig 获取配置，这样开发环境会根据平台动态选择
        cachedBaseUrl = getEnvironmentConfig(env).apiBaseUrl;
        if (__DEV__) {
          console.log('🔄 [API Config] Using environment:', env, cachedBaseUrl);
        }
      }
      return cachedBaseUrl;
    }
  } catch (error) {
    // 如果读取失败，使用默认值
    if (__DEV__) {
      console.error('Failed to get environment from storage:', error);
    }
  }
  
  // 如果没有保存的环境配置，使用编译时的环境变量或默认值
  const defaultUrl = API_BASE_URL || getDefaultBaseURL();
  
  // 根据默认 URL 推断环境（仅初始化时）
  if (!cachedBaseUrl) {
    if (defaultUrl.includes('10.0.2.2') || defaultUrl.includes('localhost')) {
      cachedEnvironment = 'development';
    } else if (defaultUrl.includes('c-api.kxf.ca')) {
      cachedEnvironment = 'production';
    } else {
      cachedEnvironment = 'production';
    }
    cachedBaseUrl = defaultUrl;
  }
  
  return defaultUrl;
}

/**
 * 同步获取 API 配置（用于初始化）
 * 注意：这个函数返回的是编译时的配置，运行时切换环境需要通过 getCurrentApiBaseUrl
 */
export const API_CONFIG = {
  get BASE_URL(): string {
    // 这个值在初始化时使用，运行时切换环境需要通过 API 服务层
    return API_BASE_URL || getDefaultBaseURL();
  },
  get TIMEOUT(): number {
    return API_TIMEOUT ? parseInt(API_TIMEOUT, 10) : 30000;
  },
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


