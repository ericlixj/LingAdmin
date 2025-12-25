#!/bin/bash

# WSL Android SDK 配置脚本
# 自动查找并配置 Windows 上的 Android SDK

echo "🔍 正在查找 Windows 上的 Android SDK..."

# 获取 Windows 用户名（从 WSL 环境变量或路径推断）
WINDOWS_USER=""
if [ -n "$WSLENV" ]; then
    # 尝试从环境变量获取
    WINDOWS_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n')
fi

# 如果无法获取，尝试常见路径
if [ -z "$WINDOWS_USER" ]; then
    # 查找所有用户目录
    for user_dir in /mnt/c/Users/*; do
        if [ -d "$user_dir/AppData/Local/Android/Sdk" ]; then
            WINDOWS_USER=$(basename "$user_dir")
            break
        fi
    done
fi

# 常见的 Android SDK 位置
POSSIBLE_PATHS=(
    "/mnt/c/Users/$WINDOWS_USER/AppData/Local/Android/Sdk"
    "/mnt/c/Users/$USER/AppData/Local/Android/Sdk"
    "/mnt/c/Users/*/AppData/Local/Android/Sdk"
)

SDK_PATH=""

# 查找 SDK
for path_pattern in "${POSSIBLE_PATHS[@]}"; do
    # 处理通配符
    for path in $path_pattern; do
        if [ -d "$path" ] && [ -f "$path/platform-tools/adb.exe" ]; then
            SDK_PATH="$path"
            echo "✅ 找到 Android SDK: $SDK_PATH"
            break 2
        fi
    done
done

# 如果没找到，让用户输入
if [ -z "$SDK_PATH" ]; then
    echo "❌ 未自动找到 Android SDK"
    echo ""
    echo "Android SDK 通常位于："
    echo "  C:\\Users\\<用户名>\\AppData\\Local\\Android\\Sdk"
    echo ""
    echo "在 WSL 中对应的路径是："
    echo "  /mnt/c/Users/<用户名>/AppData/Local/Android/Sdk"
    echo ""
    read -p "请输入 Android SDK 的完整路径（WSL 格式）: " SDK_PATH
    
    if [ ! -d "$SDK_PATH" ] || [ ! -f "$SDK_PATH/platform-tools/adb.exe" ]; then
        echo "❌ 路径无效或未找到 adb.exe"
        exit 1
    fi
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
    sed -i '/alias adb=/d' "$SHELL_CONFIG"
    sed -i '/alias emulator=/d' "$SHELL_CONFIG"
fi

# 添加配置
echo "" >> "$SHELL_CONFIG"
echo "# Android SDK (WSL -> Windows)" >> "$SHELL_CONFIG"
echo "export ANDROID_HOME=$SDK_PATH" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> "$SHELL_CONFIG"
echo "# 便捷别名（使用 .exe 扩展名）" >> "$SHELL_CONFIG"
echo "alias adb='\$ANDROID_HOME/platform-tools/adb.exe'" >> "$SHELL_CONFIG"
echo "alias emulator='\$ANDROID_HOME/emulator/emulator.exe'" >> "$SHELL_CONFIG"

echo "✅ 已添加配置到 $SHELL_CONFIG"
echo ""
echo "📋 配置内容："
echo "  ANDROID_HOME=$SDK_PATH"
echo "  alias adb='adb.exe'"
echo "  alias emulator='emulator.exe'"
echo ""
echo "🔄 请运行以下命令应用配置："
echo "  source $SHELL_CONFIG"
echo ""
echo "或重新打开终端窗口"
echo ""
echo "✅ 验证安装："
echo "  source $SHELL_CONFIG"
echo "  echo \$ANDROID_HOME"
echo "  adb version"
echo ""
echo "💡 提示：在 WSL 中使用 Windows 可执行文件需要 .exe 扩展名"
echo "   已创建别名方便使用：adb 和 emulator"







