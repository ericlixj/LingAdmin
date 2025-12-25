#!/bin/bash
# Android APK 构建脚本
set -e
cd "$(dirname "$0")"
echo "🚀 开始构建 Android APK..."
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI 未安装，请运行: npm install -g eas-cli"
    exit 1
fi
if ! eas whoami &> /dev/null; then
    echo "❌ 未登录，请运行: eas login"
    exit 1
fi
echo "👤 当前用户: $(eas whoami)"
echo ""
read -p "选择构建环境 (1=production, 2=preview, 3=development, 默认=1): " choice
case $choice in
    2) PROFILE="preview" ;;
    3) PROFILE="development" ;;
    *) PROFILE="production" ;;
esac
echo "📦 使用 $PROFILE 环境构建..."
eas build --platform android --profile "$PROFILE"
echo ""
echo "✅ 构建已启动！查看进度: https://expo.dev/accounts/ericlixj/projects/lingadmin-mobile/builds"
