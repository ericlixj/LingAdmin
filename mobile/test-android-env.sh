#!/bin/bash
echo "=== Android 环境检查 ==="
echo ""
echo "1. ANDROID_HOME:"
source ~/.bashrc 2>/dev/null
echo "   $ANDROID_HOME"
echo ""
echo "2. adb 测试:"
$ANDROID_HOME/platform-tools/adb.exe version 2>&1 | head -3
echo ""
echo "3. 连接的设备:"
$ANDROID_HOME/platform-tools/adb.exe devices 2>&1
echo ""
echo "4. Expo 版本:"
npx expo --version 2>&1 | head -1
echo ""
echo "5. SDK 文件检查:"
ls -la $ANDROID_HOME/platform-tools/adb.exe 2>/dev/null && echo "   ✅ adb.exe 存在" || echo "   ❌ adb.exe 不存在"
