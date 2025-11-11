#!/bin/bash

echo "启动所有服务..."
docker compose down
docker compose build --no-cache
docker compose up -d

echo "完成。"
