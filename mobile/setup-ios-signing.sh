#!/bin/bash
# iOS 代码签名设置脚本

set -e

cd "$(dirname "$0")"

echo "🔧 iOS 代码签名设置"
echo "=================="
echo ""

# 1. 预构建 iOS 项目
if [ ! -d "ios" ]; then
    echo "📦 预构建 iOS 项目..."
    npx expo prebuild --platform ios
    echo ""
fi

# 2. 安装 CocoaPods（如果需要）
if [ -d "ios" ] && [ -f "ios/Podfile" ] && [ ! -d "ios/Pods" ]; then
    echo "📦 安装 CocoaPods 依赖..."
    cd ios
    pod install
    cd ..
    echo ""
fi

# 3. 打开 Xcode
echo "🚀 正在打开 Xcode..."
echo ""

WORKSPACE=$(find ios -name "*.xcworkspace" -maxdepth 1 2>/dev/null | head -1)
PROJECT=$(find ios -name "*.xcodeproj" -maxdepth 1 2>/dev/null | head -1)

if [ -n "$WORKSPACE" ]; then
    open "$WORKSPACE"
    echo "✅ 已打开 Xcode workspace"
elif [ -n "$PROJECT" ]; then
    open "$PROJECT"
    echo "✅ 已打开 Xcode project"
    echo "⚠️  建议使用 .xcworkspace（如果存在）"
else
    echo "❌ 未找到 Xcode 项目文件"
    exit 1
fi

echo ""
echo "📱 现在在 Xcode 中配置代码签名："
echo ""
echo "1. 点击左侧导航器顶部的蓝色项目图标"
echo "2. 选择 TARGETS > 你的应用名称"
echo "3. 点击 'Signing & Capabilities' 标签"
echo "4. ✅ 勾选 'Automatically manage signing'"
echo "5. 在 Team 下拉菜单中选择你的 Apple ID"
echo "   - 如果没有，点击 'Add Account...' 登录"
echo "   - 免费 Apple ID 也可以使用"
echo "6. 等待 Xcode 自动生成证书"
echo ""
echo "配置完成后，运行:"
echo "  npm run ios -- --device"
echo ""

