#!/bin/bash
# iOS 启动脚本

set -e

echo "🍎 启动 iOS 应用..."
echo ""

# 检查是否在 macOS 上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: iOS 开发只能在 macOS 上进行"
    exit 1
fi

# 检查是否有 iOS 设备或模拟器
echo "📱 检查可用的 iOS 设备/模拟器..."

# 检查是否有已连接的设备
DEVICES=$(xcrun simctl list devices available 2>/dev/null | grep -i "iphone" | head -1 || echo "")

if [ -z "$DEVICES" ]; then
    echo "⚠️  警告: 没有检测到可用的 iOS 模拟器"
    echo ""
    echo "💡 选项："
    echo "   1. 使用 Expo Go（推荐，无需模拟器）"
    echo "   2. 安装 Xcode 并使用 iOS 模拟器"
    echo ""
    echo "🚀 启动 Expo 开发服务器（Expo Go 模式）..."
    echo ""
    echo "💡 提示："
    echo "   - 在 iPhone 上安装 Expo Go 应用（App Store 搜索 'Expo Go'）"
    echo "   - 确保 iPhone 和 Mac 在同一 WiFi 网络"
    echo "   - 在 Expo Go 中扫描终端显示的二维码"
    echo ""
    exec npx expo start --go --ios
else
    echo "✅ 检测到 iOS 模拟器"
    echo ""
    echo "💡 提示："
    echo "   - 可以按 'i' 键在 iOS 模拟器中打开"
    echo "   - 或在模拟器中打开 Expo Go 并扫描二维码"
    echo ""
    exec npx expo start --go --ios
fi



