#!/bin/bash

echo "停止旧服务11..."
docker compose down

echo "重新构建镜像..."
docker compose build --no-cache

echo "启动所有服务..."
docker compose up -d

echo "等待服务启动..."
sleep 3

echo "显示容器日志（按 Ctrl + C 退出）"
docker compose logs -f
