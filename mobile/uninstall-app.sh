#!/bin/bash
# 卸载 Android 应用

set -e

echo "📱 卸载 LingAdmin 应用..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
fi

# 检查 adb 是否可用
if [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb.exe"
elif [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb"
else
    echo "❌ 错误: 找不到 adb"
    echo "   请确保 ANDROID_HOME 已正确设置"
    exit 1
fi

# 检查设备连接
echo "📱 检查设备连接..."
DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  警告: 没有检测到 Android 设备或模拟器"
    echo ""
    echo "请选择卸载方法："
    echo "1. 在模拟器中手动卸载（推荐）"
    echo "   长按应用图标 -> 选择'卸载'"
    echo ""
    echo "2. 等待设备连接后重试"
    exit 1
fi

echo "✅ 检测到 $DEVICES 个设备"
$ADB devices
echo ""

# 应用包名
PACKAGE_NAME="com.lingadmin.mobile"

# 检查应用是否已安装
echo "🔍 检查应用是否已安装..."
INSTALLED=$($ADB shell pm list packages | grep "$PACKAGE_NAME" || echo "")

if [ -z "$INSTALLED" ]; then
    echo "ℹ️  应用未安装或已卸载"
    exit 0
fi

echo "✅ 找到已安装的应用: $PACKAGE_NAME"
echo ""

# 卸载应用
echo "🗑️  正在卸载应用..."
$ADB uninstall "$PACKAGE_NAME"

if [ $? -eq 0 ]; then
    echo "✅ 应用已成功卸载"
else
    echo "❌ 卸载失败"
    echo ""
    echo "如果卸载失败，可以尝试："
    echo "1. 在模拟器中手动卸载："
    echo "   - 长按应用图标"
    echo "   - 选择'卸载'"
    echo ""
    echo "2. 或者使用强制卸载："
    echo "   $ADB uninstall -k $PACKAGE_NAME"
    exit 1
fi

