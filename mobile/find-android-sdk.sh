#!/bin/bash

# 查找 Android SDK 脚本

echo "🔍 正在查找 Android SDK..."
echo ""

# 检查 C 盘
echo "检查 C 盘..."
C_SDK="/mnt/c/Users/ericl/AppData/Local/Android/Sdk"
if [ -d "$C_SDK" ] && [ -f "$C_SDK/platform-tools/adb.exe" ]; then
    echo "✅ 找到 (C盘): $C_SDK"
fi

# 检查 D 盘常见位置
echo ""
echo "检查 D 盘..."
D_PATHS=(
    "/mnt/d/Users/ericl/AppData/Local/Android/Sdk"
    "/mnt/d/Android/Sdk"
    "/mnt/d/Program Files/Android/Sdk"
    "/mnt/d/AndroidStudio/Sdk"
)

for path in "${D_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/platform-tools/adb.exe" ] 2>/dev/null; then
        echo "✅ 找到 (D盘): $path"
    fi
done

# 搜索所有可能的 SDK 位置
echo ""
echo "搜索所有驱动器..."
for drive in /mnt/{c,d,e,f}; do
    if [ -d "$drive" ]; then
        found=$(find "$drive" -name "adb.exe" -path "*/platform-tools/*" 2>/dev/null | head -1)
        if [ -n "$found" ]; then
            sdk_path=$(dirname "$(dirname "$found")")
            echo "✅ 找到: $sdk_path"
        fi
    fi
done

echo ""
echo "💡 提示：如果 Android Studio 在 D 盘，但 SDK 可能在 C 盘（默认位置）"
echo "   或者 SDK 也在 D 盘，但路径可能不同"







