import 'dotenv/config';

// 确保 Android SDK 路径在 WSL 中可用
if (process.platform === 'linux' && !process.env.ANDROID_HOME) {
  // 尝试从常见位置设置
  const possiblePaths = [
    '/mnt/c/Users/ericl/AppData/Local/Android/Sdk',
    process.env.HOME + '/Android/Sdk',
  ];
  
  for (const path of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(path + '/platform-tools/adb.exe') || 
          fs.existsSync(path + '/platform-tools/adb')) {
        process.env.ANDROID_HOME = path;
        process.env.PATH = (process.env.PATH || '') + ':' + path + '/platform-tools';
        break;
      }
    } catch (e) {
      // 忽略错误
    }
  }
}

export default {
  expo: {
    name: 'Ling',
    slug: 'lingadmin-mobile',
    owner: 'ericlixj',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/adaptive-icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.lingadmin.mobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.lingadmin.mobile',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [],
    scheme: 'lingadmin',
    extra: {
      // API 配置：根据环境变量或默认值
      // 本地开发：使用 .env 文件中的配置
      // 生产环境：使用 EAS 环境变量或默认值 https://c-api.kxf.ca
      apiBaseUrl: process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://c-api.kxf.ca' : 'http://localhost:4000'),
      apiTimeout: process.env.API_TIMEOUT || '30000',
      router: {
        origin: false,
      },
      eas: {
        projectId: '0ea1d167-d9cb-40c6-9244-f8576639232f',
      },
    },
  },
};


