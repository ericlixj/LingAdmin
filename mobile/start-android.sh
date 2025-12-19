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
else
    echo "✅ 检测到 $DEVICES 个设备"
    $ADB devices
    echo ""
fi

# 检查是否安装了 Expo Go
echo "🔍 检查是否安装了 Expo Go..."
EXPO_GO_PACKAGE="host.exp.exponent"
INSTALLED=$($ADB shell pm list packages 2>/dev/null | grep "$EXPO_GO_PACKAGE" | wc -l)

if [ "$INSTALLED" -eq 0 ]; then
    echo "⚠️  未检测到 Expo Go 应用"
    echo ""
    echo "💡 请先在模拟器上安装 Expo Go："
    echo "   1. 在模拟器中打开 Google Play Store"
    echo "   2. 搜索并安装 'Expo Go'"
    echo "   或访问: https://play.google.com/store/apps/details?id=host.exp.exponent"
    echo ""
    read -p "是否继续启动开发服务器？（安装 Expo Go 后可以扫描二维码连接）（y/n）" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ 检测到 Expo Go 已安装"
    echo ""
fi

# 启动 Expo 开发服务器（使用 Expo Go）
echo "🚀 启动 Expo 开发服务器（Expo Go 模式）..."
echo ""
echo "💡 提示："
echo "   - 在模拟器中打开 Expo Go 应用"
echo "   - 扫描终端中显示的二维码"
echo "   - 或按 'a' 键自动在 Android 模拟器中打开"
echo "   - 如果 Expo Go 版本过旧，请在 Google Play Store 中更新"
echo ""

# 使用 --non-interactive 来避免交互式提示，但保持热重载功能
exec npx expo start --go --android --non-interactive



