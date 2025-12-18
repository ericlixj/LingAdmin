#!/bin/bash
# 构建并安装原生 Android 应用（不使用 Expo Go）

set -e

echo "🔨 构建原生 Android 应用..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
fi

# 修复 WSL 中的 adb 路径问题
if [ ! -e "$ANDROID_HOME/platform-tools/adb" ] && [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ln -sf "$ANDROID_HOME/platform-tools/adb.exe" "$ANDROID_HOME/platform-tools/adb" 2>/dev/null || true
fi

echo "📱 Android SDK: $ANDROID_HOME"
echo ""

# 显示当前 API 配置
echo "📋 当前 API 配置："
cat .env | grep API_BASE_URL || echo "⚠️  未找到 API_BASE_URL"
echo ""

# 检查设备
echo "📱 检查连接的设备..."
if [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb.exe"
else
    ADB="$ANDROID_HOME/platform-tools/adb"
fi

DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  警告: 没有检测到 Android 设备或模拟器"
    echo "   请确保："
    echo "   1. 在 Windows 上启动了 Android Studio"
    echo "   2. 启动了 Android 模拟器"
    exit 1
fi

echo "✅ 检测到 $DEVICES 个设备"
$ADB devices
echo ""

# 检查是否需要预构建
if [ ! -d "android" ]; then
    echo "📦 首次构建，需要预构建原生项目..."
    echo "   这可能需要几分钟时间..."
    echo ""
    npx expo prebuild --platform android
    echo ""
fi

# 清除缓存
echo "🧹 清除构建缓存..."
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true
echo "✅ 缓存已清除"
echo ""

# 构建并安装
echo "🔨 开始构建并安装原生应用..."
echo "   这可能需要几分钟时间..."
echo ""
echo "💡 提示："
echo "   - 首次构建可能需要 5-10 分钟"
echo "   - 构建完成后会自动安装到模拟器"
echo "   - 应用包名: com.lingadmin.mobile"
echo ""

npx expo run:android

echo ""
echo "✅ 构建完成！"
echo ""
echo "📱 应用已安装到模拟器，包名: com.lingadmin.mobile"

