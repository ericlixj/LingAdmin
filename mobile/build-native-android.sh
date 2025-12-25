#!/bin/bash
# 构建并安装原生 Android 应用（不使用 Expo Go）

set -e

echo "🔨 构建原生 Android 应用..."
echo ""

# 加载环境变量
source ~/.bashrc 2>/dev/null || true

# 检查并设置 JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    # 尝试自动检测 Java
    if command -v java &> /dev/null; then
        JAVA_PATH=$(which java)
        JAVA_HOME_CANDIDATE=$(readlink -f "$JAVA_PATH" 2>/dev/null | sed "s|/bin/java||" || echo "")
        if [ -n "$JAVA_HOME_CANDIDATE" ] && [ -d "$JAVA_HOME_CANDIDATE" ]; then
            export JAVA_HOME="$JAVA_HOME_CANDIDATE"
        fi
    fi
    
    # 如果仍未设置，尝试常见路径
    if [ -z "$JAVA_HOME" ]; then
        POSSIBLE_PATHS=(
            "/usr/lib/jvm/java-17-openjdk-amd64"
            "/usr/lib/jvm/java-17-openjdk"
            "/usr/lib/jvm/default-java"
        )
        for path in "${POSSIBLE_PATHS[@]}"; do
            if [ -d "$path" ]; then
                export JAVA_HOME="$path"
                break
            fi
        done
    fi
fi

# 检查 Java 是否可用
if [ -z "$JAVA_HOME" ] || [ ! -f "$JAVA_HOME/bin/java" ]; then
    echo "❌ 错误: JAVA_HOME 未设置或 Java 未安装"
    echo ""
    echo "请运行以下命令安装 Java："
    echo "  ./setup-java.sh"
    echo ""
    echo "或手动安装："
    echo "  sudo apt install openjdk-17-jdk"
    echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
    exit 1
fi

export PATH="$JAVA_HOME/bin:$PATH"
echo "☕ Java: $JAVA_HOME"
echo ""

# 确保 ANDROID_HOME 已设置
if [ -z "$ANDROID_HOME" ]; then
    export ANDROID_HOME=/mnt/c/Users/ericl/AppData/Local/Android/Sdk
    export PATH=$PATH:$ANDROID_HOME/platform-tools
    export PATH=$PATH:$ANDROID_HOME/emulator
    echo "📝 已设置 ANDROID_HOME: $ANDROID_HOME"
fi

# 修复 WSL 中的 adb 路径问题
if [ ! -e "$ANDROID_HOME/platform-tools/adb" ] && [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ln -sf "$ANDROID_HOME/platform-tools/adb.exe" "$ANDROID_HOME/platform-tools/adb" 2>/dev/null || true
    echo "📝 已创建 adb 符号链接"
fi

echo "📱 Android SDK: $ANDROID_HOME"
echo ""

# 检查 Android SDK 是否存在
if [ ! -d "$ANDROID_HOME" ]; then
    echo "❌ 错误: Android SDK 目录不存在: $ANDROID_HOME"
    echo ""
    echo "请确保："
    echo "1. Android Studio 已安装"
    echo "2. Android SDK 路径正确"
    echo "3. 或在 ~/.bashrc 中设置 ANDROID_HOME"
    exit 1
fi

# 显示当前 API 配置
echo "📋 当前 API 配置："
if [ -f ".env" ]; then
    cat .env | grep API_BASE_URL || echo "⚠️  未找到 API_BASE_URL"
else
    echo "⚠️  未找到 .env 文件"
fi
echo ""

# 检查设备
echo "📱 检查连接的设备..."
if [ -f "$ANDROID_HOME/platform-tools/adb.exe" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb.exe"
elif [ -f "$ANDROID_HOME/platform-tools/adb" ]; then
    ADB="$ANDROID_HOME/platform-tools/adb"
else
    echo "❌ 错误: 找不到 adb 工具"
    echo "   路径: $ANDROID_HOME/platform-tools/"
    exit 1
fi

# 测试 adb 是否可用
if ! $ADB version >/dev/null 2>&1; then
    echo "❌ 错误: adb 无法执行"
    echo "   请检查 Android SDK 是否正确安装"
    exit 1
fi

DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
if [ "$DEVICES" -eq 0 ]; then
    echo "⚠️  警告: 没有检测到 Android 设备或模拟器"
    echo ""
    echo "请确保："
    echo "1. 在 Windows 上启动了 Android Studio"
    echo "2. 启动了 Android 模拟器"
    echo "3. 或连接了物理设备并启用了 USB 调试"
    echo ""
    echo "当前连接的设备："
    $ADB devices
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
    
    # 检查 expo 是否安装
    if ! command -v npx &> /dev/null; then
        echo "❌ 错误: 找不到 npx"
        echo "   请确保 Node.js 和 npm 已正确安装"
        exit 1
    fi
    
    echo "运行: npx expo prebuild --platform android"
    npx expo prebuild --platform android
    
    if [ $? -ne 0 ]; then
        echo "❌ 预构建失败"
        exit 1
    fi
    
    echo "✅ 预构建完成"
    echo ""
fi

# 清除缓存（可选，但有助于解决构建问题）
echo "🧹 清除构建缓存..."
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true
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

# 使用 expo run:android 构建
echo "运行: npx expo run:android"
npx expo run:android

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 构建完成！"
    echo ""
    echo "📱 应用已安装到模拟器，包名: com.lingadmin.mobile"
    echo ""
    echo "💡 下一步："
    echo "   运行 'npm start' 启动开发服务器"
else
    echo ""
    echo "❌ 构建失败"
    echo ""
    echo "💡 故障排查："
    echo "   1. 检查 Android SDK 是否正确安装"
    echo "   2. 检查 Gradle 是否可用"
    echo "   3. 查看上面的错误信息"
    echo "   4. 尝试运行: npm run android:rebuild"
    exit 1
fi
