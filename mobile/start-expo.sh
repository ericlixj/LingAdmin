#!/bin/bash
# Expo 启动脚本（确保环境变量正确加载）

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
fi

# 显示环境变量（调试用）
echo "🔧 ANDROID_HOME: $ANDROID_HOME"
echo "🔧 PATH includes: $(echo $PATH | grep -o '[^:]*android[^:]*' | head -2)"

# 启动 Expo（使用 npx 确保使用本地安装的版本）
exec npx expo start "$@"
