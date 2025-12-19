#!/bin/bash
# iOS 真机构建和部署脚本

set -e

echo "🍎 iOS 真机构建和部署"
echo "===================="
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

# 切换到项目目录
cd "$(dirname "$0")"

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

# 进入 iOS 目录
cd ios

# 检查 Podfile
if [ ! -f "Podfile" ]; then
    echo "❌ 错误: 未找到 Podfile"
    echo "   请先运行: npx expo prebuild --platform ios"
    exit 1
fi

# 检查 Pods 目录
if [ ! -d "Pods" ]; then
    echo "📦 安装 CocoaPods 依赖..."
    pod install
    echo ""
else
    echo "✅ CocoaPods 依赖已安装"
    echo ""
fi

# 返回项目根目录
cd ..

echo "✅ 准备工作完成！"
echo ""
echo "📱 接下来的步骤："
echo ""
echo "1. 连接 iPhone 到 Mac（使用 USB 线）"
echo ""
echo "2. 在 iPhone 上信任此电脑："
echo "   - iPhone 会显示'要信任此电脑吗？'"
echo "   - 点击'信任'并输入密码"
echo ""
echo "3. 打开 Xcode 项目："
echo "   open ios/*.xcworkspace"
echo ""
echo "4. 在 Xcode 中："
echo "   a. 选择你的 iPhone 作为运行目标（顶部设备选择器）"
echo "   b. 选择项目 > Target > Signing & Capabilities"
echo "   c. 勾选 'Automatically manage signing'"
echo "   d. 选择你的 Team（需要 Apple Developer 账号）"
echo "   e. Bundle Identifier 会自动生成，如果有冲突请修改"
echo ""
echo "5. 点击运行按钮（▶️）或按 Cmd+R 构建并安装到 iPhone"
echo ""
echo "💡 提示："
echo "   - 首次安装需要在 iPhone 上信任开发者证书"
echo "   - 前往 设置 > 通用 > VPN与设备管理"
echo "   - 找到你的开发者证书并点击'信任'"
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

