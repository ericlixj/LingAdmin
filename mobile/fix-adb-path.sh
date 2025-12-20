#!/bin/bash
# 修复 adb 路径问题（WSL 需要 .exe 扩展名）

SDK_PATH="/mnt/c/Users/ericl/AppData/Local/Android/Sdk"
PLATFORM_TOOLS="$SDK_PATH/platform-tools"

echo "🔧 修复 adb 路径问题..."
echo ""

# 检查 SDK 路径
if [ ! -d "$PLATFORM_TOOLS" ]; then
    echo "❌ 错误: SDK 路径不存在: $PLATFORM_TOOLS"
    exit 1
fi

# 检查 adb.exe
if [ ! -f "$PLATFORM_TOOLS/adb.exe" ]; then
    echo "❌ 错误: adb.exe 不存在: $PLATFORM_TOOLS/adb.exe"
    exit 1
fi

echo "✅ 找到 adb.exe: $PLATFORM_TOOLS/adb.exe"
echo ""

# 创建符号链接（如果不存在）
if [ ! -e "$PLATFORM_TOOLS/adb" ]; then
    echo "📝 创建符号链接: adb -> adb.exe"
    if ln -sf "$PLATFORM_TOOLS/adb.exe" "$PLATFORM_TOOLS/adb" 2>/dev/null; then
        echo "✅ 符号链接已创建"
    else
        echo "⚠️  警告: 符号链接创建可能失败（在 WSL 中可能需要管理员权限）"
        echo "   建议: 如果使用 Expo，可以尝试使用 Expo Go（扫描 QR 码）"
    fi
else
    echo "ℹ️  符号链接已存在: $PLATFORM_TOOLS/adb"
fi

# 验证
echo ""
echo "✅ 验证:"
if [ -e "$PLATFORM_TOOLS/adb" ]; then
    echo "   adb 符号链接存在"
    # 测试（在 WSL 中可能无法直接执行，但路径应该存在）
    if [ -L "$PLATFORM_TOOLS/adb" ]; then
        # 使用 readlink 获取符号链接目标（兼容不同系统）
        TARGET=$(readlink "$PLATFORM_TOOLS/adb" 2>/dev/null || readlink -f "$PLATFORM_TOOLS/adb" 2>/dev/null || echo "无法解析")
        echo "   ✅ 符号链接指向: $TARGET"
    fi
else
    echo "   ⚠️  adb 符号链接不存在"
fi

echo ""
echo "💡 提示: 在 WSL 中，Expo 可能需要使用 adb.exe"
echo "   如果仍有问题，建议使用 Expo Go（扫描 QR 码）"





