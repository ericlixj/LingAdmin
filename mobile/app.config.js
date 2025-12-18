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
    name: 'LingAdmin',
    slug: 'lingadmin-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
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
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
      apiTimeout: process.env.API_TIMEOUT || '30000',
    },
  },
};


