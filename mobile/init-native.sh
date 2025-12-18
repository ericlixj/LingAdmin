#!/bin/bash

# React Native 原生代码初始化脚本
# 这个脚本会在现有项目基础上初始化 Android 和 iOS 原生代码

set -e

echo "🚀 开始初始化 React Native 原生代码..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在 mobile 目录下运行此脚本"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "📁 临时目录: $TEMP_DIR"

# 初始化新的 React Native 项目（仅用于获取原生代码）
echo "📦 正在创建临时 React Native 项目..."
npx react-native@0.73.0 init LingAdminTemp --skip-install --directory "$TEMP_DIR"

# 复制 Android 目录
if [ -d "$TEMP_DIR/android" ]; then
    echo "📱 复制 Android 原生代码..."
    cp -r "$TEMP_DIR/android" .
    echo "✅ Android 目录已创建"
else
    echo "⚠️  警告: 未找到 Android 目录"
fi

# 复制 iOS 目录
if [ -d "$TEMP_DIR/ios" ]; then
    echo "🍎 复制 iOS 原生代码..."
    cp -r "$TEMP_DIR/ios" .
    echo "✅ iOS 目录已创建"
else
    echo "⚠️  警告: 未找到 iOS 目录"
fi

# 清理临时目录
echo "🧹 清理临时文件..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ 原生代码初始化完成！"
echo ""
echo "下一步："
echo "1. 安装依赖: npm install"
echo "2. 对于 iOS (仅 macOS): cd ios && pod install && cd .."
echo "3. 启动应用: npm run android 或 npm run ios"


