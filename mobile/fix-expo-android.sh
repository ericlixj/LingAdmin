#!/bin/bash

# 修复 Expo Android SDK 路径问题

echo "🔧 修复 Expo Android SDK 配置..."

# 确保环境变量已设置
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME 未设置，从 ~/.bashrc 加载..."
    source ~/.bashrc 2>/dev/null || true
fi

# 如果仍然没有，设置默认值
if [ -z "$ANDROID_HOME" ]; then
    ANDROID_HOME="/mnt/c/Users/ericl/AppData/Local/Android/Sdk"
    echo "📝 使用默认路径: $ANDROID_HOME"
fi

# 验证路径
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ Android SDK 路径不存在: $ANDROID_HOME"
    echo "请检查路径是否正确"
    exit 1
fi

if [ ! -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    echo "❌ 未找到 adb.exe: $ANDROID_HOME/platform-tools/adb.exe"
    exit 1
fi

echo "✅ Android SDK 路径: $ANDROID_HOME"

# 导出环境变量（当前会话）
export ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator

echo ""
echo "✅ 环境变量已设置"
echo "   ANDROID_HOME=$ANDROID_HOME"
echo ""
echo "🚀 现在可以运行:"
echo "   npm start"
echo "   或"
echo "   expo start"
echo ""
echo "💡 提示：如果仍有问题，建议使用 Expo Go（扫描 QR 码）"
echo "   这样无需配置 Android SDK"

