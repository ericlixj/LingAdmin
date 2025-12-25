#!/bin/bash

# 验证 Android 模拟器网络配置

echo "🔍 验证 Android 模拟器网络配置..."
echo ""

cd "$(dirname "$0")/.."

# 1. 检查后端服务
echo "📦 步骤 1/4: 检查后端服务..."
if curl -s http://localhost:4000/api/c/health >/dev/null 2>&1; then
    echo "✅ 后端服务正在运行（WSL localhost:4000）"
else
    echo "❌ 后端服务未运行"
    echo "   请先启动后端服务："
    echo "   cd capp/backend && npm start"
    exit 1
fi
echo ""

# 2. 检查 adb reverse
echo "📦 步骤 2/4: 检查 adb 端口转发..."
if [ -f "/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe" ]; then
    ADB="/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe"
    
    # 检查设备
    DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
    if [ "$DEVICES" -gt 0 ]; then
        echo "✅ 检测到 $DEVICES 个设备"
        
        # 设置/更新端口转发
        echo "   设置端口转发: 4000 -> 4000"
        $ADB reverse tcp:4000 tcp:4000 2>&1
        
        # 检查端口转发
        REVERSE_LIST=$($ADB reverse --list 2>/dev/null | grep "4000" || echo "")
        if [ -n "$REVERSE_LIST" ]; then
            echo "✅ 端口转发已设置: $REVERSE_LIST"
        else
            echo "⚠️  端口转发可能未生效"
        fi
    else
        echo "⚠️  未检测到 Android 设备"
    fi
else
    echo "⚠️  未找到 adb"
fi
echo ""

# 3. 检查 .env 配置
echo "📦 步骤 3/4: 检查 .env 配置..."
if [ -f "mobile/.env" ]; then
    API_URL=$(grep "API_BASE_URL" mobile/.env | cut -d '=' -f2)
    echo "   API_BASE_URL=$API_URL"
    
    if echo "$API_URL" | grep -q "localhost"; then
        echo "✅ 配置正确（使用 localhost，配合 adb reverse）"
    elif echo "$API_URL" | grep -q "10.0.2.2"; then
        echo "⚠️  使用 10.0.2.2，可能需要配置 Windows 防火墙"
    fi
else
    echo "⚠️  未找到 mobile/.env 文件"
fi
echo ""

# 4. 总结
echo "📦 步骤 4/4: 总结..."
echo ""
echo "✅ 配置检查完成"
echo ""
echo "💡 如果仍然无法连接，尝试："
echo "   1. 重启应用（在模拟器中）"
echo "   2. 检查 Windows 防火墙设置"
echo "   3. 确认后端服务输出显示："
echo "      [INFO] c-backend listening on 0.0.0.0:4000"
echo ""
