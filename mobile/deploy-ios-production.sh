#!/bin/bash
# iOS Production 环境部署脚本

set -e

cd "$(dirname "$0")"

echo "🍎 iOS Production 环境部署"
echo "========================"
echo ""

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

# 设置 production 环境变量
echo "📝 设置 production 环境配置..."
cat > .env << EOF
API_BASE_URL=https://c-api.kxf.ca
API_TIMEOUT=30000
NODE_ENV=production
EOF

echo "✅ 环境变量已设置："
echo "   API_BASE_URL=https://c-api.kxf.ca"
echo "   NODE_ENV=production"
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
    echo "   请确保 iPhone 已通过 USB 连接到 Mac"
    echo ""
    read -p "是否继续？（设备可以在 Xcode 中选择）(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    echo ""
fi

# 检查 iOS 目录
if [ ! -d "ios" ]; then
    echo "🔨 预构建 iOS 原生项目..."
    npx expo prebuild --platform ios
    echo ""
fi

# 进入 iOS 目录安装 CocoaPods
if [ -d "ios" ]; then
    cd ios
    
    # 检查 Podfile
    if [ -f "Podfile" ]; then
        if [ ! -d "Pods" ]; then
            echo "📦 安装 CocoaPods 依赖..."
            if [ -f ~/.netrc ]; then
                chmod 600 ~/.netrc 2>/dev/null || true
            fi
            pod install
            echo ""
        fi
    fi
    
    cd ..
fi

echo "✅ 准备工作完成！"
echo ""
echo "📱 接下来的步骤："
echo ""
echo "1. 在 Xcode 中打开项目:"
echo "   open ios/*.xcworkspace"
echo ""
echo "2. 配置代码签名："
echo "   - 选择项目 > Target > Signing & Capabilities"
echo "   - 勾选 'Automatically manage signing'"
echo "   - 选择你的 Team"
echo ""
echo "3. 选择 Release 配置："
echo "   - Product > Scheme > Edit Scheme..."
echo "   - 选择 Run，将 Build Configuration 设置为 Release"
echo ""
echo "4. 选择你的 iPhone 并运行："
echo "   - 在顶部选择设备"
echo "   - 点击运行按钮（▶️）"
echo ""
echo "5. 验证环境："
echo "   - 打开应用后，在首页查看环境配置"
echo "   - 应该显示 '生产环境' 和 'https://c-api.kxf.ca'"
echo ""

# 询问是否直接打开 Xcode
read -p "是否现在打开 Xcode 项目？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 正在打开 Xcode..."
    open ios/*.xcworkspace
    echo ""
    echo "✅ Xcode 已打开，请按照上述步骤配置并运行"
fi

