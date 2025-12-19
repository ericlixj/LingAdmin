/**
 * 环境配置定义
 * 支持在运行时切换不同的环境
 */

export type Environment = 'development' | 'preview' | 'production';

export interface EnvironmentConfig {
  name: string;
  apiBaseUrl: string;
  apiTimeout: number;
  description: string;
}

export const ENVIRONMENTS: Record<Environment, EnvironmentConfig> = {
  development: {
    name: '开发环境',
    apiBaseUrl: 'http://10.0.2.2:4000',
    apiTimeout: 30000,
    description: '本地开发服务器（Android 模拟器）',
  },
  preview: {
    name: '预览环境',
    apiBaseUrl: 'https://c-api.kxf.ca',
    apiTimeout: 30000,
    description: '生产 API 服务器（用于测试）',
  },
  production: {
    name: '生产环境',
    apiBaseUrl: 'https://c-api.kxf.ca',
    apiTimeout: 30000,
    description: '生产 API 服务器',
  },
};

/**
 * 获取环境配置
 */
export function getEnvironmentConfig(env: Environment): EnvironmentConfig {
  return ENVIRONMENTS[env];
}

/**
 * 获取所有可用环境
 */
export function getAllEnvironments(): Environment[] {
  return Object.keys(ENVIRONMENTS) as Environment[];
}
