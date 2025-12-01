#!/bin/bash
# Admin Backend 启动脚本
# 启动前先清理已有进程

echo "=========================================="
echo "检查并清理已有进程..."
echo "=========================================="

# 1. 杀死占用 8000 端口的进程
PIDS=$(lsof -t -i :8000 2>/dev/null)
if [ -n "$PIDS" ]; then
    echo "发现端口 8000 被占用，杀死进程: $PIDS"
    kill -9 $PIDS 2>/dev/null
    sleep 1
else
    echo "端口 8000 未被占用"
fi

# 2. 杀死所有 uvicorn 相关进程（当前目录下的）
UVICORN_PIDS=$(pgrep -f "uvicorn app.main:app" 2>/dev/null)
if [ -n "$UVICORN_PIDS" ]; then
    echo "发现 uvicorn 进程: $UVICORN_PIDS，正在杀死..."
    kill -9 $UVICORN_PIDS 2>/dev/null
    sleep 1
else
    echo "没有发现残留的 uvicorn 进程"
fi

# 3. 杀死可能残留的爬虫进程
SPIDER_PIDS=$(pgrep -f "run_flipp_spider.py\|flipp_spider\|gasbuddy_spider" 2>/dev/null)
if [ -n "$SPIDER_PIDS" ]; then
    echo "发现爬虫进程: $SPIDER_PIDS，正在杀死..."
    kill -9 $SPIDER_PIDS 2>/dev/null
    sleep 1
else
    echo "没有发现残留的爬虫进程"
fi

echo "=========================================="
echo "启动 Admin Backend..."
echo "=========================================="

# 确保日志目录存在
mkdir -p logs

# 后台启动 FastAPI，日志输出到文件
nohup uvicorn app.main:app --reload >> logs/admin_backend.log 2>&1 &
UVICORN_PID=$!

echo "FastAPI 已在后台启动，PID: $UVICORN_PID"
echo "日志文件: logs/admin_backend.log"
echo "按 Ctrl+C 停止查看日志（服务仍在后台运行）"
echo "停止服务请运行: kill $UVICORN_PID 或重新运行 ./start.sh"
echo "=========================================="

# 等待一下让服务启动
sleep 2

# 实时查看日志
tail -f logs/admin_backend.log
