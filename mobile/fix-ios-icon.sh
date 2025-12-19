#!/bin/bash
# 修复 iOS 图标脚本

set -e

cd "$(dirname "$0")"

echo "🍎 修复 iOS 图标"
echo "================"
echo ""

# 检查图标文件是否存在
if [ ! -f "assets/adaptive-icon.png" ]; then
    echo "❌ 错误: assets/adaptive-icon.png 不存在"
    echo "   请确保图标文件存在"
    exit 1
fi

echo "✅ 找到图标文件: assets/adaptive-icon.png"
echo ""

# 检查图标文件信息
echo "📋 图标文件信息:"
file assets/adaptive-icon.png
echo ""

# 如果 iOS 目录存在，需要重新生成图标
if [ -d "ios" ]; then
    echo "⚠️  检测到 ios 目录已存在"
    echo "   为了确保图标正确生成，建议重新构建 iOS 项目"
    echo ""
    read -p "是否删除 ios 目录并重新生成？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  删除 ios 目录..."
        rm -rf ios
        echo "✅ 已删除"
        echo ""
    else
        echo "ℹ️  跳过删除，将使用现有配置"
        echo ""
    fi
fi

# 重新预构建 iOS 项目以生成图标
echo "🔨 重新预构建 iOS 项目..."
npx expo prebuild --platform ios

echo ""
echo "✅ iOS 图标应该已经正确生成"
echo ""
echo "📱 接下来的步骤："
echo "1. 打开 Xcode: open ios/*.xcworkspace"
echo "2. 检查 Assets.xcassets/AppIcon.appiconset 目录"
echo "3. 确保图标文件已正确加载"
echo "4. 清理构建: Product > Clean Build Folder (Cmd+Shift+K)"
echo "5. 重新构建并运行"
echo ""

