#!/bin/bash
# Admin Backend 停止脚本

echo "=========================================="
echo "停止 Admin Backend..."
echo "=========================================="

# 1. 杀死占用 8000 端口的进程
PIDS=$(lsof -t -i :8000 2>/dev/null)
if [ -n "$PIDS" ]; then
    echo "发现端口 8000 进程: $PIDS，正在杀死..."
    kill -9 $PIDS 2>/dev/null
    sleep 1
else
    echo "端口 8000 未被占用"
fi

# 2. 杀死所有 uvicorn 相关进程
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app" 2>/dev/null)
if [ -n "$UVICORN_PIDS" ]; then
    echo "发现 uvicorn 进程: $UVICORN_PIDS，正在杀死..."
    kill -9 $UVICORN_PIDS 2>/dev/null
    sleep 1
else
    echo "没有发现 uvicorn 进程"
fi

# 3. 杀死可能残留的爬虫进程
SPIDER_PIDS=$(pgrep -f "run_flipp_spider.py\|flipp_spider\|gasbuddy_spider" 2>/dev/null)
if [ -n "$SPIDER_PIDS" ]; then
    echo "发现爬虫进程: $SPIDER_PIDS，正在杀死..."
    kill -9 $SPIDER_PIDS 2>/dev/null
    sleep 1
else
    echo "没有发现爬虫进程"
fi

echo "=========================================="
echo "Admin Backend 已停止"
echo "=========================================="



