#!/bin/bash

# 记录当前目录
CURRENT_DIR=$(pwd)

# 前往 codegen 目录
cd ../../backend/codegen || { echo "目录不存在: ../../backend/codegen"; exit 1; }

# 执行代码生成脚本
python main4md.py || { echo "执行 main4md.py 失败"; cd "$CURRENT_DIR"; exit 1; }

# 回到原始目录
cd "$CURRENT_DIR" || exit

echo "代码生成完成，已返回 $CURRENT_DIR"
