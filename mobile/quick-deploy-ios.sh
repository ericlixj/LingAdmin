#!/bin/bash
# Expo iOS 真机快速部署

cd "$(dirname "$0")"

echo "🍎 开始部署到 iOS 真机..."
echo ""

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖中..."
    npm install
fi

echo "🚀 启动 Expo iOS 部署..."
echo "💡 这会自动："
echo "   - 构建 iOS 项目（如果需要）"
echo "   - 安装到连接的 iPhone"
echo ""

# 使用 Expo CLI 直接运行到设备
npx expo run:ios --device

