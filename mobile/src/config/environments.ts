/**
 * 环境配置定义
 * 支持在运行时切换不同的环境
 */

import {Platform} from 'react-native';

export type Environment = 'development' | 'production';

export interface EnvironmentConfig {
  name: string;
  apiBaseUrl: string;
  apiTimeout: number;
  description: string;
}

// 基础环境配置（不包含平台特定的开发环境）
const BASE_ENVIRONMENTS: Record<Exclude<Environment, 'development'>, EnvironmentConfig> = {
  production: {
    name: '生产环境',
    apiBaseUrl: 'https://c-api.kxf.ca',
    apiTimeout: 30000,
    description: '生产 API 服务器',
  },
};

/**
 * 获取开发环境的配置（根据平台动态选择）
 */
function getDevelopmentConfig(): EnvironmentConfig {
  if (Platform.OS === 'android') {
    return {
      name: '开发环境',
      apiBaseUrl: 'http://10.0.2.2:4000',
      apiTimeout: 30000,
      description: '本地开发服务器（Android 模拟器）',
    };
  } else {
    // iOS
    return {
      name: '开发环境',
      apiBaseUrl: 'http://localhost:4000',
      apiTimeout: 30000,
      description: '本地开发服务器（iOS 模拟器）',
    };
  }
}

/**
 * 获取环境配置
 * 开发环境会根据平台动态返回不同的配置
 */
export function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  if (env === 'development') {
    return getDevelopmentConfig();
  }
  return BASE_ENVIRONMENTS[env];
}

/**
 * 获取所有环境配置（用于显示）
 * 注意：开发环境会根据当前平台返回对应的配置
 */
export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  development: getDevelopmentConfig(),
  ...BASE_ENVIRONMENTS,
};

/**
 * 获取所有可用环境
 */
export function getAllEnvironments(): Environment[] {
  return Object.keys(ENVIRONMENTS) as Environment[];
}
