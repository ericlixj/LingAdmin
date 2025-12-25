#!/bin/bash

# 从 WSL 中启动 Android 模拟器（如果可能）

set -e

echo "🚀 从 WSL 启动 Android 模拟器..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
fi

# 检查模拟器工具
if [ -f "$ANDROID_HOME/emulator/emulator.exe" ]; then
    EMULATOR="$ANDROID_HOME/emulator/emulator.exe"
elif [ -f "$ANDROID_HOME/emulator/emulator" ]; then
    EMULATOR="$ANDROID_HOME/emulator/emulator"
else
    echo "❌ 错误: 找不到模拟器工具"
    echo "   路径: $ANDROID_HOME/emulator/"
    exit 1
fi

# 列出可用的 AVD
echo "📱 可用的 Android 虚拟设备："
$EMULATOR -list-avds 2>/dev/null || echo "⚠️  无法列出 AVD，可能需要先在 Android Studio 中创建"

echo ""
echo "💡 注意："
echo "   在 WSL 中直接启动模拟器可能有限制"
echo "   推荐方案："
echo "   1. 在 Windows 的 Android Studio Device Manager 中启动模拟器"
echo "   2. 然后在 WSL 中使用 adb 连接"
echo ""
echo "   或者使用 Expo Go（无需模拟器）"
echo ""

# 如果提供了 AVD 名称，尝试启动
if [ -n "$1" ]; then
    AVD_NAME="$1"
    echo "🚀 启动模拟器: $AVD_NAME"
    echo ""
    echo "⚠️  注意：模拟器窗口会在 Windows 中打开"
    echo ""
    
    # 启动模拟器（在后台）
    $EMULATOR -avd "$AVD_NAME" &
    
    echo "⏳ 等待模拟器启动..."
    sleep 5
    
    # 检查设备
    if [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
        ADB="$ANDROID_HOME/platform-tools/adb.exe"
    else
        ADB="$ANDROID_HOME/platform-tools/adb"
    fi
    
    # 等待设备就绪
    MAX_WAIT=60
    WAIT_COUNT=0
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
        if [ "$DEVICES" -gt 0 ]; then
            echo "✅ 模拟器已启动并连接"
            $ADB devices
            exit 0
        fi
        WAIT_COUNT=$((WAIT_COUNT + 1))
        echo "   等待中... ($WAIT_COUNT/$MAX_WAIT)"
        sleep 2
    done
    
    echo "⚠️  模拟器启动超时，但可能仍在启动中"
else
    echo "💡 使用方法："
    echo "   ./start-emulator-from-wsl.sh <AVD_NAME>"
    echo ""
    echo "   例如："
    echo "   ./start-emulator-from-wsl.sh Pixel_8"
fi
