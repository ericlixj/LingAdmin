module.exports = function(api) {
  // 在开发环境下禁用缓存，确保环境变量更改能立即生效
  // 生产环境可以启用缓存以提高性能
  api.cache(false);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          safe: false,
          allowUndefined: true,
          verbose: false,
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};


