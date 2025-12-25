import axios, {AxiosInstance, AxiosError} from 'axios';
import {API_CONFIG, getCurrentApiBaseUrl, clearApiBaseUrlCache} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {normalizeApiResponse} from '../utils/dataFormatter';
import {getEnvironmentConfig, Environment} from '../config/environments';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const ENVIRONMENT_STORAGE_KEY = 'app_environment';

// 调试模式：在开发环境下启用详细日志
const DEBUG = __DEV__;

class ApiService {
  private api: AxiosInstance;
  private currentBaseUrl: string = API_CONFIG.BASE_URL;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 先使用默认配置创建实例
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      // 禁用 axios 的缓存
      validateStatus: (status) => status < 500, // 允许 304 等状态码，但我们会处理
    });

    this.setupInterceptors();
    
    // 异步加载环境配置并更新
    this.initPromise = this.initializeApi();
    
    // 监听环境变化
    this.setupEnvironmentListener();
  }

  // 初始化 API 实例（异步加载环境配置）
  private async initializeApi() {
    try {
      // 获取当前环境的 API 地址
      const baseUrl = await getCurrentApiBaseUrl();
      if (baseUrl !== this.currentBaseUrl) {
        this.currentBaseUrl = baseUrl;
        this.api.defaults.baseURL = baseUrl;
        
        if (DEBUG) {
          console.log('✅ [API Service] Initialized with base URL:', baseUrl);
        }
      }
    } catch (error) {
      console.error('Failed to initialize API with environment config:', error);
    }
  }

  // 确保初始化完成
  private async ensureInitialized() {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  // 设置环境变化监听
  private setupEnvironmentListener() {
    // 定期检查环境是否变化（每2秒）
    setInterval(async () => {
      const newBaseUrl = await getCurrentApiBaseUrl();
      if (newBaseUrl !== this.currentBaseUrl) {
        if (DEBUG) {
          console.log('🔄 [API Service] Environment changed, updating base URL:', {
            old: this.currentBaseUrl,
            new: newBaseUrl,
          });
        }
        this.currentBaseUrl = newBaseUrl;
        // 更新现有实例的 baseURL
        this.api.defaults.baseURL = newBaseUrl;
      }
    }, 2000);
  }

  // 手动更新环境（供外部调用）
  async updateEnvironment() {
    // 清除缓存，强制重新读取环境配置
    clearApiBaseUrlCache();
    const newBaseUrl = await getCurrentApiBaseUrl();
    if (newBaseUrl !== this.currentBaseUrl) {
      if (DEBUG) {
        console.log('🔄 [API Service] Manually updating environment:', {
          old: this.currentBaseUrl,
          new: newBaseUrl,
        });
      }
      this.currentBaseUrl = newBaseUrl;
      this.api.defaults.baseURL = newBaseUrl;
    }
  }

  // 设置拦截器
  private setupInterceptors() {

    // 请求拦截器 - 添加 token 和调试日志
    this.api.interceptors.request.use(
      async config => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 调试日志：记录请求信息
        if (DEBUG) {
          console.log('🌐 [API Request]', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            headers: {
              ...config.headers,
              Authorization: token ? 'Bearer ***' : undefined,
            },
            data: config.data,
            params: config.params,
            paramsString: config.params ? JSON.stringify(config.params, null, 2) : null,
          });
        }
        
        return config;
      },
      error => {
        if (DEBUG) {
          console.error('❌ [API Request Error]', error);
        }
        return Promise.reject(error);
      },
    );

    // 响应拦截器 - 处理错误和调试日志
    this.api.interceptors.response.use(
      response => {
        // 处理 304 Not Modified - 强制重新请求
        if (response.status === 304) {
          if (DEBUG) {
            console.warn('⚠️ [API] 收到 304 响应，强制重新请求:', response.config.url);
          }
          // 304 响应通常没有 data，需要重新请求
          // 这里我们返回一个错误，让调用方处理
          return Promise.reject({
            response: {
              status: 304,
              statusText: 'Not Modified',
              data: null,
            },
            config: response.config,
            message: '缓存响应，需要重新请求',
          });
        }
        
        // 调试日志：记录成功响应
        if (DEBUG) {
          console.log('✅ [API Response Raw]', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
            requestParams: response.config.params,
            requestData: response.config.data,
            dataType: typeof response.data,
            isArray: Array.isArray(response.data),
            hasCode: response.data && typeof response.data === 'object' && 'code' in response.data,
            dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : null,
            fullResponse: JSON.stringify(response.data, null, 2),
            dataSample: Array.isArray(response.data) 
              ? response.data.slice(0, 2)
              : (response.data && typeof response.data === 'object' && 'data' in response.data && Array.isArray(response.data.data))
                ? response.data.data.slice(0, 2)
                : response.data,
          });
        }
        return response;
      },
      async error => {
        // 详细的错误日志
        if (DEBUG) {
          const errorInfo: any = {
            message: error.message,
            code: error.code,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
          };

          if (error.response) {
            // 服务器返回了错误响应
            errorInfo.response = {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              headers: error.response.headers,
            };
            console.error('❌ [API Response Error]', errorInfo);
          } else if (error.request) {
            // 请求已发出但没有收到响应
            errorInfo.request = error.request;
            errorInfo.message = '网络错误：无法连接到服务器';
            console.error('❌ [API Network Error]', errorInfo);
          } else {
            // 其他错误
            console.error('❌ [API Error]', errorInfo);
          }
        }

        if (error.response?.status === 401) {
          // Token 过期，清除存储并跳转到登录
          await this.clearTokens();
          // 这里可以触发导航到登录页面
        }
        return Promise.reject(error);
      },
    );
  }

  // 设置 token
  async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  // 清除 token
  async clearTokens() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // 获取 token
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  // GET 请求
  async get<T>(url: string, params?: any): Promise<T> {
    // 确保已初始化
    await this.ensureInitialized();
    
    // 每次请求前检查环境是否变化
    const currentBaseUrl = await getCurrentApiBaseUrl();
    if (currentBaseUrl !== this.currentBaseUrl) {
      this.currentBaseUrl = currentBaseUrl;
      this.api.defaults.baseURL = currentBaseUrl;
    }

    try {
      // 清理参数：移除 undefined 值，但保留空字符串和 0
      const cleanParams = params ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ) : undefined;

      // 调试日志：记录请求参数
      if (DEBUG) {
        console.log('📤 [API GET Request]', {
          url,
          originalParams: params,
          cleanParams,
          paramsString: cleanParams ? JSON.stringify(cleanParams, null, 2) : null,
          paramsKeys: cleanParams ? Object.keys(cleanParams) : [],
        });
      }

      const response = await this.api.get(url, {params: cleanParams});
      
      // 调试日志：记录原始响应
      if (DEBUG) {
        console.log('📥 [API GET Response]', {
          url,
          requestParams: cleanParams,
          requestParamsString: cleanParams ? JSON.stringify(cleanParams, null, 2) : null,
          actualRequestUrl: response.config.url,
          actualRequestParams: response.config.params,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          hasCode: response.data && typeof response.data === 'object' && 'code' in response.data,
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : null,
          fullResponseData: JSON.stringify(response.data, null, 2),
        });
      }
      
      // 如果响应已经是标准格式 { code, message, data }，直接返回
      // 否则标准化响应格式
      if (response.data && typeof response.data === 'object' && 'code' in response.data) {
        if (DEBUG) {
          console.log('✅ [API GET] Response already in standard format');
        }
        return response.data as T;
      }
      
      // 标准化响应格式
      const normalized = normalizeApiResponse(response.data);
      if (DEBUG) {
        console.log('🔄 [API GET] Normalized response:', {
          code: normalized.code,
          dataType: typeof normalized.data,
          isArray: Array.isArray(normalized.data),
        });
      }
      return normalized as T;
    } catch (error: any) {
      // 增强错误信息
      if (DEBUG) {
        console.error(`[API GET Error] ${url}`, error);
      }
      throw this.enhanceError(error, 'GET', url);
    }
  }

  // POST 请求
  async post<T>(url: string, data?: any): Promise<T> {
    await this.ensureInitialized();
    
    // 每次请求前检查环境是否变化
    const currentBaseUrl = await getCurrentApiBaseUrl();
    if (currentBaseUrl !== this.currentBaseUrl) {
      this.currentBaseUrl = currentBaseUrl;
      this.api.defaults.baseURL = currentBaseUrl;
    }

    try {
      // 调试日志：记录 POST 请求（始终记录，不只在 DEBUG 模式）
      console.log('📤 [API POST Request]', {
        url,
        baseURL: this.api.defaults.baseURL,
        fullURL: `${this.api.defaults.baseURL}${url}`,
        method: 'POST',
        data: data ? JSON.stringify(data, null, 2) : undefined,
      });

      const response = await this.api.post(url, data);
      
      // 调试日志：记录 POST 响应（始终记录，不只在 DEBUG 模式）
      console.log('✅ [API POST Response]', {
        url,
        status: response.status,
        statusText: response.statusText,
        data: response.data ? JSON.stringify(response.data, null, 2) : undefined,
      });
      
      // 标准化响应格式
      return normalizeApiResponse(response.data) as T;
    } catch (error: any) {
      if (DEBUG) {
        console.error(`❌ [API POST Error] ${url}`, {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
      throw this.enhanceError(error, 'POST', url);
    }
  }

  // PATCH 请求
  async patch<T>(url: string, data?: any): Promise<T> {
    await this.ensureInitialized();
    
    const currentBaseUrl = await getCurrentApiBaseUrl();
    if (currentBaseUrl !== this.currentBaseUrl) {
      this.currentBaseUrl = currentBaseUrl;
      this.api.defaults.baseURL = currentBaseUrl;
    }

    try {
      const response = await this.api.patch(url, data);
      // 标准化响应格式
      return normalizeApiResponse(response.data) as T;
    } catch (error: any) {
      if (DEBUG) {
        console.error(`[API PATCH Error] ${url}`, error);
      }
      throw this.enhanceError(error, 'PATCH', url);
    }
  }

  // DELETE 请求
  async delete<T>(url: string): Promise<T> {
    await this.ensureInitialized();
    
    const currentBaseUrl = await getCurrentApiBaseUrl();
    if (currentBaseUrl !== this.currentBaseUrl) {
      this.currentBaseUrl = currentBaseUrl;
      this.api.defaults.baseURL = currentBaseUrl;
    }

    try {
      const response = await this.api.delete(url);
      // 标准化响应格式
      return normalizeApiResponse(response.data) as T;
    } catch (error: any) {
      if (DEBUG) {
        console.error(`[API DELETE Error] ${url}`, error);
      }
      throw this.enhanceError(error, 'DELETE', url);
    }
  }

  // 增强错误信息，提供更友好的错误消息
  private enhanceError(error: any, method: string, url: string): Error {
    let message = '网络错误';
    
    if (error.response) {
      // 服务器返回了错误响应
      const status = error.response.status;
      const data = error.response.data;
      
      if (data?.message) {
        message = data.message;
      } else if (status === 404) {
        message = '请求的资源不存在';
      } else if (status === 401) {
        message = '未授权，请重新登录';
      } else if (status === 403) {
        message = '没有权限访问此资源';
      } else if (status >= 500) {
        message = '服务器错误，请稍后重试';
      } else {
        message = `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      if (error.code === 'ECONNABORTED') {
        message = '请求超时，请检查网络连接';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        message = `无法连接到服务器 (${API_CONFIG.BASE_URL})，请检查 API 地址配置`;
      } else {
        message = '网络连接失败，请检查网络设置';
      }
    } else {
      // 其他错误
      message = error.message || '未知错误';
    }

    const enhancedError = new Error(message);
    (enhancedError as any).originalError = error;
    (enhancedError as any).method = method;
    (enhancedError as any).url = url;
    (enhancedError as any).baseURL = API_CONFIG.BASE_URL;
    
    return enhancedError;
  }
}

export default new ApiService();


