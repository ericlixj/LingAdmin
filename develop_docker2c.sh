#!/bin/bash

echo "启动所有服务..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "停止 backend 和 frontend2c 服务..."
docker compose stop backend frontend2c

echo "完成。"
