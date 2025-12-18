#!/bin/bash
# 完全重新构建 Android 应用（清除所有缓存并重新安装）

set -e

echo "🧹 开始完全重新构建 Android 应用..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
fi

echo "📱 Android SDK: $ANDROID_HOME"
echo ""

# 显示当前 API 配置
echo "📋 当前 API 配置："
cat .env | grep API_BASE_URL || echo "⚠️  未找到 API_BASE_URL"
echo ""

# 1. 停止所有相关进程
echo "🛑 停止所有相关进程..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

# 2. 清除所有缓存
echo "🧹 清除所有缓存..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf .expo-shared
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true
rm -rf ios/build 2>/dev/null || true

# 清除 watchman（如果安装了）
if command -v watchman &> /dev/null; then
    echo "🧹 清除 watchman 缓存..."
    watchman watch-del-all 2>/dev/null || true
fi

echo "✅ 缓存已清除"
echo ""

# 3. 卸载旧应用（如果已安装）
echo "📱 卸载旧应用..."
if [ -n "$ANDROID_HOME" ] && [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    "$ANDROID_HOME/platform-tools/adb.exe" uninstall com.lingadmin.mobile 2>/dev/null || echo "应用未安装或已卸载"
fi
echo ""

# 4. 清除 Metro bundler 缓存并启动
echo "🚀 启动 Expo（清除缓存模式）..."
echo ""
echo "💡 提示："
echo "   1. 等待 Metro bundler 启动完成"
echo "   2. 在模拟器中按 'a' 键安装并运行应用"
echo "   3. 或者运行: npm run android"
echo ""

exec npx expo start --clear --android


