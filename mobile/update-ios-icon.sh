#!/bin/bash
# 更新 iOS 图标脚本

set -e

cd "$(dirname "$0")"

echo "🍎 更新 iOS 图标"
echo "================"
echo ""

# 检查图标文件
if [ ! -f "assets/adaptive-icon.png" ]; then
    echo "❌ 错误: assets/adaptive-icon.png 不存在"
    exit 1
fi

echo "✅ 找到图标文件: assets/adaptive-icon.png"
echo ""

# 如果 iOS 目录存在，删除它以便重新生成
if [ -d "ios" ]; then
    echo "⚠️  检测到 ios 目录存在"
    echo "   需要删除并重新生成以应用新的图标配置"
    echo ""
    read -p "是否继续？这将删除 ios 目录并重新生成 (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 已取消"
        exit 1
    fi
    
    echo "🗑️  删除 ios 目录..."
    rm -rf ios
    echo "✅ 已删除"
    echo ""
fi

# 重新预构建 iOS 项目
echo "🔨 重新预构建 iOS 项目（使用 adaptive-icon.png）..."
npx expo prebuild --platform ios

echo ""
echo "✅ iOS 项目已重新生成"
echo ""
echo "📱 接下来的步骤："
echo ""
echo "1. 在 Xcode 中打开项目:"
echo "   open ios/*.xcworkspace"
echo ""
echo "2. 检查图标："
echo "   - 打开 ios/Ling/Images.xcassets/AppIcon.appiconset"
echo "   - 确认图标文件已正确加载"
echo ""
echo "3. 清理并重新构建："
echo "   - 在 Xcode 中: Product > Clean Build Folder (Cmd+Shift+K)"
echo "   - 然后 Product > Build (Cmd+B)"
echo ""
echo "4. 运行到设备："
echo "   npm run ios -- --device"
echo ""

