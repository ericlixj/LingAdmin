#!/bin/bash

# 清除缓存并重启 Expo 开发服务器
# 用于在修改 .env 文件后重新加载环境变量

echo "🧹 清除 Metro bundler 缓存..."
npx expo start --clear

