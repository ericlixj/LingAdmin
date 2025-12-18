#!/bin/bash
# Android 启动脚本（确保环境变量正确加载）

set -e

echo "🚀 启动 Android 应用..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
fi

# 修复 WSL 中的 adb 路径问题（创建符号链接）
if [ ! -e "$ANDROID_HOME/platform-tools/adb" ] && [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ln -sf "$ANDROID_HOME/platform-tools/adb.exe" "$ANDROID_HOME/platform-tools/adb" 2>/dev/null || true
fi

# 显示环境信息
echo "📱 Android SDK: $ANDROID_HOME"
echo ""

# 检查设备
echo "📱 检查连接的设备..."
DEVICES=$($ANDROID_HOME/platform-tools/adb.exe devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  警告: 没有检测到 Android 设备或模拟器"
    echo "   请确保："
    echo "   1. 在 Windows 上启动了 Android Studio"
    echo "   2. 启动了 Android 模拟器"
    echo "   或使用 Expo Go（扫描 QR 码）"
    echo ""
    read -p "是否继续启动 Expo？（y/n）" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ 检测到 $DEVICES 个设备"
    $ANDROID_HOME/platform-tools/adb.exe devices
    echo ""
fi

# 启动 Expo
echo "🚀 启动 Expo..."
echo ""
exec npx expo start --android


