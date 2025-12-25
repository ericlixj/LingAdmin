#!/bin/bash

# 安装和配置 Java JDK 17（Android 构建需要）

set -e

echo "☕ 安装和配置 Java JDK 17..."
echo ""

# 检查是否已安装 Java
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "✅ 检测到 Java: $JAVA_VERSION"
    
    # 检查版本
    if echo "$JAVA_VERSION" | grep -q "17"; then
        echo "✅ Java 17 已安装"
    else
        echo "⚠️  检测到其他版本的 Java，建议使用 JDK 17"
    fi
    
    # 检查 JAVA_HOME
    if [ -n "$JAVA_HOME" ]; then
        echo "✅ JAVA_HOME 已设置: $JAVA_HOME"
    else
        echo "⚠️  JAVA_HOME 未设置，尝试自动检测..."
        
        # 尝试查找 Java 路径
        JAVA_PATH=$(which java)
        if [ -n "$JAVA_PATH" ]; then
            # 从 java 命令路径推断 JAVA_HOME
            JAVA_HOME_CANDIDATE=$(readlink -f "$JAVA_PATH" | sed "s|/bin/java||")
            if [ -d "$JAVA_HOME_CANDIDATE" ]; then
                export JAVA_HOME="$JAVA_HOME_CANDIDATE"
                echo "✅ 自动检测到 JAVA_HOME: $JAVA_HOME"
            fi
        fi
    fi
else
    echo "📦 安装 OpenJDK 17..."
    echo ""
    
    # 更新包列表
    sudo apt update
    
    # 安装 OpenJDK 17
    sudo apt install -y openjdk-17-jdk
    
    if [ $? -eq 0 ]; then
        echo "✅ OpenJDK 17 安装成功"
    else
        echo "❌ 安装失败，请手动安装："
        echo "   sudo apt install openjdk-17-jdk"
        exit 1
    fi
fi

# 设置 JAVA_HOME（如果未设置）
if [ -z "$JAVA_HOME" ]; then
    # 尝试常见的 Java 安装路径
    POSSIBLE_PATHS=(
        "/usr/lib/jvm/java-17-openjdk-amd64"
        "/usr/lib/jvm/java-17-openjdk"
        "/usr/lib/jvm/default-java"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -d "$path" ]; then
            export JAVA_HOME="$path"
            echo "✅ 设置 JAVA_HOME: $JAVA_HOME"
            break
        fi
    done
    
    if [ -z "$JAVA_HOME" ]; then
        echo "⚠️  无法自动检测 JAVA_HOME"
        echo ""
        echo "请手动设置："
        echo "  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
        echo ""
        echo "或添加到 ~/.bashrc："
        echo "  echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc"
        echo "  source ~/.bashrc"
        exit 1
    fi
fi

# 验证 Java
echo ""
echo "🔍 验证 Java 安装..."
echo "JAVA_HOME: $JAVA_HOME"
echo "Java 版本:"
"$JAVA_HOME/bin/java" -version 2>&1 | head -3

# 添加到 PATH（如果不在 PATH 中）
if [[ ":$PATH:" != *":$JAVA_HOME/bin:"* ]]; then
    export PATH="$JAVA_HOME/bin:$PATH"
    echo ""
    echo "✅ 已添加 Java 到 PATH"
fi

echo ""
echo "✅ Java 配置完成！"
echo ""
echo "💡 提示："
echo "   要将这些设置永久保存，请添加到 ~/.bashrc："
echo "   export JAVA_HOME=$JAVA_HOME"
echo "   export PATH=\$JAVA_HOME/bin:\$PATH"
echo ""
