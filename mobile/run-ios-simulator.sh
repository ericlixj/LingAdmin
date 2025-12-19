#!/bin/bash
# iOS 模拟器运行脚本

set -e

cd "$(dirname "$0")"

echo "📱 在 iOS 模拟器中运行应用"
echo "=========================="
echo ""

# 检查是否在 macOS 上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: iOS 开发只能在 macOS 上进行"
    exit 1
fi

# 检查 Xcode
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "❌ 错误: 未找到 Xcode"
    echo "   请从 App Store 安装 Xcode"
    exit 1
fi

echo "✅ 检测到 Xcode"
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    echo ""
fi

# 检查 iOS 目录
if [ ! -d "ios" ]; then
    echo "🔨 预构建 iOS 原生项目..."
    npx expo prebuild --platform ios
    echo ""
fi

# 检查 CocoaPods
if [ -d "ios" ] && [ -f "ios/Podfile" ] && [ ! -d "ios/Pods" ]; then
    echo "📦 安装 CocoaPods 依赖..."
    cd ios
    if [ -f ~/.netrc ]; then
        chmod 600 ~/.netrc 2>/dev/null || true
    fi
    pod install
    cd ..
    echo ""
fi

echo "✅ 准备工作完成！"
echo ""
echo "🚀 启动应用到 iOS 模拟器..."
echo ""

# 使用 Expo CLI 运行到模拟器（会自动打开模拟器）
npm run ios

echo ""
echo "💡 提示："
echo "   - 模拟器会自动启动"
echo "   - 如果遇到问题，可以在 Xcode 中手动运行"
echo "   - Xcode 命令: open ios/*.xcworkspace"
echo ""

