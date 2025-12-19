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

# 日志文件路径：系统目录
LOG_DIR="/deploy/logs/lingadmin/admin"
LOG_FILE="${LOG_DIR}/admin_backend.log"

# 确保日志目录存在
echo "检查日志目录: $LOG_DIR"
if [ ! -d "$LOG_DIR" ]; then
    echo "创建日志目录: $LOG_DIR"
    # 尝试创建目录（可能需要 sudo）
    if mkdir -p "$LOG_DIR" 2>/dev/null; then
        echo "✓ 目录创建成功"
    elif sudo mkdir -p "$LOG_DIR" 2>/dev/null; then
        echo "✓ 目录创建成功（使用 sudo）"
        # 设置权限，让当前用户可写
        sudo chown -R $(whoami):$(whoami) "$LOG_DIR" 2>/dev/null || true
        sudo chmod 755 "$LOG_DIR" 2>/dev/null || true
    else
        echo "✗ 错误: 无法创建日志目录 $LOG_DIR"
        echo "请手动创建目录: sudo mkdir -p $LOG_DIR && sudo chmod 755 $LOG_DIR"
        exit 1
    fi
else
    echo "✓ 日志目录已存在"
fi

# 确保目录可写
if [ ! -w "$LOG_DIR" ]; then
    echo "警告: 日志目录不可写，尝试设置权限..."
    sudo chmod 755 "$LOG_DIR" 2>/dev/null || chmod 755 "$LOG_DIR" 2>/dev/null || true
fi

# 后台启动 FastAPI，日志输出到文件
nohup uvicorn app.main:app --reload >> "$LOG_FILE" 2>&1 &
UVICORN_PID=$!

echo "FastAPI 已在后台启动，PID: $UVICORN_PID"
echo "日志文件: $LOG_FILE"
echo "按 Ctrl+C 停止查看日志（服务仍在后台运行）"
echo "停止服务请运行: kill $UVICORN_PID 或重新运行 ./start.sh"
echo "=========================================="

# 等待一下让服务启动
sleep 2

# 实时查看日志
tail -f "$LOG_FILE"
