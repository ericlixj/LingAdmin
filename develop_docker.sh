#!/bin/bash

echo "启动所有服务..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "停止 admin-backend 和 admin-frontend 服务..."
docker compose stop admin-backend admin-frontend

echo "完成。"
