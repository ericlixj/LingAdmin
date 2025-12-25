#!/bin/bash

# Android SDK 环境变量配置脚本
# 这个脚本会帮助您配置 ANDROID_HOME 环境变量

echo "🔍 正在查找 Android SDK..."

# 常见的 Android SDK 位置
POSSIBLE_PATHS=(
    "$HOME/Android/Sdk"
    "$HOME/.android/sdk"
    "$HOME/Library/Android/sdk"
    "/opt/android-sdk"
    "/usr/local/android-sdk"
)

SDK_PATH=""

# 查找 SDK
for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -d "$path/platform-tools" ]; then
        SDK_PATH="$path"
        echo "✅ 找到 Android SDK: $SDK_PATH"
        break
    fi
done

# 如果没找到，提示用户
if [ -z "$SDK_PATH" ]; then
    echo "❌ 未找到 Android SDK"
    echo ""
    echo "请选择："
    echo "1. 使用 Expo Go（推荐，无需 Android Studio）"
    echo "2. 安装 Android Studio 后重新运行此脚本"
    echo ""
    echo "如果您知道 SDK 路径，可以手动设置："
    echo "  export ANDROID_HOME=/path/to/android/sdk"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
    exit 1
fi

# 检测 shell 类型
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

echo ""
echo "📝 检测到 shell 配置文件: $SHELL_CONFIG"
echo ""

# 检查是否已配置
if grep -q "ANDROID_HOME" "$SHELL_CONFIG" 2>/dev/null; then
    echo "⚠️  检测到已有 ANDROID_HOME 配置"
    read -p "是否要更新配置？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消"
        exit 0
    fi
    # 删除旧的配置
    sed -i '/ANDROID_HOME/d' "$SHELL_CONFIG"
    sed -i '/Android SDK/d' "$SHELL_CONFIG"
fi

# 添加配置
echo "" >> "$SHELL_CONFIG"
echo "# Android SDK" >> "$SHELL_CONFIG"
echo "export ANDROID_HOME=$SDK_PATH" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> "$SHELL_CONFIG"

echo "✅ 已添加配置到 $SHELL_CONFIG"
echo ""
echo "📋 配置内容："
echo "  ANDROID_HOME=$SDK_PATH"
echo ""
echo "🔄 请运行以下命令应用配置："
echo "  source $SHELL_CONFIG"
echo ""
echo "或重新打开终端窗口"
echo ""
echo "✅ 验证安装："
echo "  echo \$ANDROID_HOME"
echo "  adb --version"







