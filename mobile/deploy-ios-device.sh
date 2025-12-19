#!/bin/bash
# Expo 项目 iOS 真机一键部署脚本

set -e

echo "🍎 Expo iOS 真机部署"
echo "==================="
echo ""

cd "$(dirname "$0")"

# 检查是否在 macOS 上
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: iOS 开发只能在 macOS 上进行"
    exit 1
fi

# 检查 Xcode
if [ ! -d "/Applications/Xcode.app" ]; then
    echo "❌ 错误: 未找到 Xcode"
    echo "   请从 App Store 安装 Xcode"
    exit 1
fi

echo "✅ 检测到 Xcode"
echo ""

# 检查是否有连接的设备
echo "📱 检查连接的设备..."
DEVICES=$(xcrun xctrace list devices 2>/dev/null | grep -i "iphone\|ipad" | grep -v "Simulator" || echo "")
if [ -n "$DEVICES" ]; then
    echo "✅ 检测到连接的设备:"
    echo "$DEVICES" | head -3
    echo ""
else
    echo "⚠️  未检测到连接的 iOS 设备"
    echo "   请确保："
    echo "   1. iPhone 已通过 USB 连接到 Mac"
    echo "   2. 在 iPhone 上信任此电脑（如果提示）"
    echo "   3. iPhone 已解锁"
    echo ""
    read -p "是否继续？（设备可以在 Xcode 中选择）(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    echo ""
else
    echo "✅ 项目依赖已安装"
    echo ""
fi

# 预构建 iOS 项目（如果不存在）
if [ ! -d "ios" ]; then
    echo "🔨 预构建 iOS 原生项目..."
    npx expo prebuild --platform ios
    echo ""
else
    echo "✅ iOS 项目已存在"
    echo ""
fi

# 进入 iOS 目录安装 CocoaPods
if [ -d "ios" ]; then
    cd ios
    
    # 检查 Podfile
    if [ -f "Podfile" ]; then
        if [ ! -d "Pods" ]; then
            echo "📦 安装 CocoaPods 依赖..."
            # 确保 .netrc 权限正确
            if [ -f ~/.netrc ]; then
                chmod 600 ~/.netrc 2>/dev/null || true
            fi
            pod install
            echo ""
        else
            echo "✅ CocoaPods 依赖已安装"
            echo ""
        fi
    fi
    
    cd ..
fi

echo "✅ 准备工作完成！"
echo ""
echo "🚀 正在打开 Xcode..."
echo ""

# 打开 Xcode 项目
if [ -f "ios/*.xcworkspace" ]; then
    open ios/*.xcworkspace
elif [ -d "ios" ]; then
    # 查找 .xcworkspace 文件
    WORKSPACE=$(find ios -name "*.xcworkspace" -maxdepth 1 | head -1)
    if [ -n "$WORKSPACE" ]; then
        open "$WORKSPACE"
    else
        echo "⚠️  未找到 .xcworkspace 文件，尝试查找 .xcodeproj"
        PROJECT=$(find ios -name "*.xcodeproj" -maxdepth 1 | head -1)
        if [ -n "$PROJECT" ]; then
            echo "⚠️  找到了 .xcodeproj，但建议使用 .xcworkspace"
            echo "   请运行: cd ios && pod install && cd .."
            open "$PROJECT"
        else
            echo "❌ 未找到 Xcode 项目文件"
            exit 1
        fi
    fi
else
    echo "❌ iOS 目录不存在"
    exit 1
fi

echo ""
echo "📱 接下来的步骤："
echo ""
echo "1. 在 Xcode 顶部工具栏选择你的 iPhone 作为运行目标"
echo ""
echo "2. 配置代码签名："
echo "   - 点击项目名称（左侧导航器顶部）"
echo "   - 选择 Target > Signing & Capabilities"
echo "   - ✅ 勾选 'Automatically manage signing'"
echo "   - 在 Team 下拉菜单中选择你的 Apple ID"
echo "   - 如果没有账号，点击 'Add Account...' 登录"
echo ""
echo "3. 点击运行按钮（▶️）或按 Cmd+R 构建并安装"
echo ""
echo "4. 首次安装后，在 iPhone 上："
echo "   - 设置 > 通用 > VPN与设备管理"
echo "   - 找到你的开发者证书并点击 '信任'"
echo ""
echo "✅ 现在可以在 Xcode 中配置并运行了！"

