#!/bin/bash

# 修复 Android 模拟器网络连接问题

echo "🔧 修复 Android 模拟器网络连接..."
echo ""

cd "$(dirname "$0")/.."

# 1. 检查后端服务
echo "📦 步骤 1/4: 检查后端服务..."
if curl -s http://localhost:4000/api/c/health >/dev/null 2>&1; then
    echo "✅ 后端服务正在运行"
else
    echo "❌ 后端服务未运行"
    echo "   请先启动后端服务："
    echo "   cd capp/backend && npm start"
    exit 1
fi
echo ""

# 2. 检查服务绑定
echo "📦 步骤 2/4: 检查服务绑定..."
LISTENING=$(ss -tuln 2>/dev/null | grep ":4000" || netstat -tuln 2>/dev/null | grep ":4000" || echo "")
if echo "$LISTENING" | grep -q "0.0.0.0:4000\|*:4000"; then
    echo "✅ 服务已绑定到所有接口"
else
    echo "⚠️  服务可能未绑定到所有接口"
    echo "   请确保 capp/backend/index.js 中使用："
    echo "   app.listen(PORT, '0.0.0.0', ...)"
fi
echo ""

# 3. 使用 adb 端口转发（推荐）
echo "📦 步骤 3/4: 设置 adb 端口转发..."
if command -v adb &> /dev/null || [ -f "/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe" ]; then
    if [ -f "/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe" ]; then
        ADB="/mnt/c/Users/ericl/AppData/Local/Android/Sdk/platform-tools/adb.exe"
    else
        ADB="adb"
    fi
    
    # 检查设备
    DEVICES=$($ADB devices 2>/dev/null | grep -v "List" | grep "device" | wc -l)
    if [ "$DEVICES" -gt 0 ]; then
        echo "✅ 检测到 $DEVICES 个设备"
        
        # 设置端口转发
        echo "   设置端口转发: 4000 -> 4000"
        $ADB reverse tcp:4000 tcp:4000 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ 端口转发已设置"
            echo ""
            echo "💡 现在可以在 mobile/.env 中使用："
            echo "   API_BASE_URL=http://localhost:4000"
        else
            echo "⚠️  端口转发设置失败，尝试其他方案"
        fi
    else
        echo "⚠️  未检测到 Android 设备"
    fi
else
    echo "⚠️  未找到 adb，跳过端口转发"
fi
echo ""

# 4. 提供其他方案
echo "📦 步骤 4/4: 其他解决方案..."
echo ""
echo "如果仍然无法连接，尝试以下方案："
echo ""
echo "方案 A: 使用 Windows IP 地址"
echo "   1. 在 Windows PowerShell 中运行: ipconfig | findstr IPv4"
echo "   2. 在 mobile/.env 中使用该 IP:"
echo "      API_BASE_URL=http://<WINDOWS_IP>:4000"
echo ""
echo "方案 B: 在 Windows 中运行后端"
echo "   1. 在 Windows PowerShell 中："
echo "      cd capp\\backend"
echo "      npm start"
echo "   2. Android 模拟器使用 10.0.2.2:4000 应该可以正常工作"
echo ""
echo "方案 C: 检查 Windows 防火墙"
echo "   在 Windows PowerShell (管理员) 中运行："
echo "   New-NetFirewallRule -DisplayName \"WSL Backend Port 4000\" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow"
echo ""
