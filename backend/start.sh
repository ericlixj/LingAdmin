#!/bin/bash
# 杀死占用 8000 端口的进程

# 获取占用 8000 端口的 PID 并杀掉
PIDS=$(lsof -t -i :8000)

if [ -z "$PIDS" ]; then
    echo "端口 8000 没有被占用"
else
    echo "杀死进程: $PIDS"
    kill -9 $PIDS
    echo "完成"
fi

uvicorn app.main:app --reload
