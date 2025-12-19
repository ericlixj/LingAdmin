import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Environment, getEnvironmentConfig} from '../config/environments';
import {API_BASE_URL} from '@env';

const ENVIRONMENT_STORAGE_KEY = 'app_environment';

/**
 * 环境管理 Hook
 * 支持在运行时切换环境配置
 */
export function useEnvironment() {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>('production');
  const [loading, setLoading] = useState(true);

  // 加载保存的环境配置
  const loadEnvironment = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(ENVIRONMENT_STORAGE_KEY);
      if (saved) {
        setCurrentEnvironment(saved as Environment);
      } else {
        // 如果没有保存的配置，根据编译时的环境变量判断
        // 如果 .env 中有配置，使用 development，否则使用 production
        const defaultEnv: Environment = API_BASE_URL && API_BASE_URL.includes('localhost') || API_BASE_URL.includes('10.0.2.2')
          ? 'development'
          : 'production';
        setCurrentEnvironment(defaultEnv);
      }
    } catch (error) {
      console.error('Failed to load environment:', error);
      setCurrentEnvironment('production');
    } finally {
      setLoading(false);
    }
  }, []);

  // 切换环境
  const setEnvironment = useCallback(async (env: Environment) => {
    try {
      await AsyncStorage.setItem(ENVIRONMENT_STORAGE_KEY, env);
      setCurrentEnvironment(env);
      
      if (__DEV__) {
        console.log('🔄 [Environment] Switched to:', env, getEnvironmentConfig(env));
      }
    } catch (error) {
      console.error('Failed to save environment:', error);
    }
  }, []);

  // 获取当前环境的配置
  const getCurrentConfig = useCallback(() => {
    return getEnvironmentConfig(currentEnvironment);
  }, [currentEnvironment]);

  // 初始化时加载
  useEffect(() => {
    loadEnvironment();
  }, [loadEnvironment]);

  return {
    currentEnvironment,
    setEnvironment,
    getCurrentConfig,
    loading,
  };
}
