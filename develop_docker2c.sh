#!/bin/bash

echo "启动所有服务..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "停止 capp-backend 和 capp-frontend 服务..."
docker compose stop capp-backend capp-frontend

echo "请手动启动 capp-backend 和 capp-frontend 服务 进行开发。"
