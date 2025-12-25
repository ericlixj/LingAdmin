#!/bin/bash

# 快速修复 Expo Go 组件导入错误

echo "🔧 快速修复 Expo Go 组件导入错误..."
echo ""

cd "$(dirname "$0")"

# 1. 清除所有缓存
echo "📦 步骤 1/3: 清除缓存..."
rm -rf node_modules/.cache .expo .metro 2>/dev/null || true
echo "✅ 缓存已清除"
echo ""

# 2. 验证依赖
echo "📦 步骤 2/3: 验证依赖..."
if [ -d "node_modules/react-native-gesture-handler" ] && [ -d "node_modules/react-native-safe-area-context" ]; then
    echo "✅ 依赖已安装"
else
    echo "❌ 依赖未正确安装，重新安装..."
    npm install
fi
echo ""

# 3. 提示
echo "📦 步骤 3/3: 重新启动..."
echo ""
echo "💡 下一步："
echo "   1. 停止当前的开发服务器（Ctrl+C）"
echo "   2. 重新启动："
echo "      npm start -- --clear"
echo ""
echo "   如果问题仍然存在，使用原生构建："
echo "      npm run android:native"
echo ""
