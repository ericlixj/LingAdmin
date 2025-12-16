#!/bin/bash

# 生产环境部署脚本
# 用于部署整个应用栈到生产环境
# 注意：此脚本明确指定只使用 docker-compose.yml，不会加载 docker-compose.override.yml

set -e  # 遇到错误立即退出

# 定义 compose 文件（明确指定，避免加载 override 文件）
COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "🚀 生产环境部署开始"
echo "=========================================="
echo "📄 使用配置文件: docker-compose.yml (不加载 override)"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. 加载生产环境变量
echo ""
echo "📋 加载生产环境变量..."
if [ -f "traefik/config_env_production.sh" ]; then
    source traefik/config_env_production.sh
    echo "✅ 环境变量加载完成"
    echo "   DOMAIN: $DOMAIN"
    echo "   EMAIL: $EMAIL"
else
    echo "❌ 错误: 找不到 traefik/config_env_production.sh"
    exit 1
fi

# 2. 检查并创建 traefik-public 网络
echo ""
echo "🌐 检查 traefik-public 网络..."
if ! docker network ls | grep -q "traefik-public"; then
    echo "📦 创建 traefik-public 网络..."
    docker network create traefik-public
    echo "✅ traefik-public 网络创建成功"
else
    echo "✅ traefik-public 网络已存在"
fi

# 3. 启动 Traefik（如果未运行）
echo ""
echo "🔍 检查 Traefik 状态..."
if ! docker compose -f traefik/docker-compose.traefik.yml ps | grep -q "Up"; then
    echo "🚀 启动 Traefik..."
    docker compose -f traefik/docker-compose.traefik.yml up -d
    echo "⏳ 等待 Traefik 启动..."
    sleep 5
    echo "✅ Traefik 启动完成"
else
    echo "✅ Traefik 已在运行"
fi

# 4. 停止旧服务
echo ""
echo "🛑 停止旧服务..."
docker compose -f "$COMPOSE_FILE" down
echo "✅ 旧服务已停止"

# 5. 重新构建镜像
echo ""
echo "🔨 重新构建镜像..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "✅ 镜像构建完成"

# 6. 启动所有服务
echo ""
echo "🚀 启动所有服务..."
docker compose -f "$COMPOSE_FILE" up -d
echo "✅ 服务启动命令已执行"

# 7. 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 8. 检查服务状态
echo ""
echo "📊 检查服务状态..."
docker compose -f "$COMPOSE_FILE" ps

# 9. 显示服务健康状态
echo ""
echo "🏥 检查服务健康状态..."
echo "等待服务完全启动（30 秒）..."
sleep 30

# 10. 显示最终状态
echo ""
echo "=========================================="
echo "📊 最终服务状态"
echo "=========================================="
docker compose -f "$COMPOSE_FILE" ps

# 11. 显示访问信息
echo ""
echo "=========================================="
echo "🌐 服务访问地址"
echo "=========================================="
echo "📊 Traefik Dashboard: https://traefik.${DOMAIN}"
echo "🔧 Adminer: https://adminer.${DOMAIN}"
echo "🚀 API: https://api.${DOMAIN}"
echo "📱 Dashboard: https://dashboard.${DOMAIN}"
echo "🔍 OpenSearch: https://opensearch.${DOMAIN}"
echo ""

# 12. 显示日志查看命令
echo "=========================================="
echo "📝 常用命令"
echo "=========================================="
echo "查看所有日志: docker compose -f $COMPOSE_FILE logs -f"
echo "查看特定服务: docker compose -f $COMPOSE_FILE logs -f <service-name>"
echo "停止所有服务: docker compose -f $COMPOSE_FILE down"
echo "重启服务: docker compose -f $COMPOSE_FILE restart <service-name>"
echo ""

echo "✅ 生产环境部署完成！"
echo ""

