#!/bin/bash
set -e  # 遇到错误就退出

# 1. 检查参数
if [ -z "$1" ]; then
  echo "错误：请提供版本号参数（对应 Git 分支名）"
  echo "用法: $0 <版本号>"
  exit 1
fi

VERSION=$1
WORKDIR="/root/deploy/work/LingAdmin"

echo "开始部署版本：$VERSION"

# 2. 进入工作目录
if [ ! -d "$WORKDIR" ]; then
  echo "目录不存在: $WORKDIR"
  exit 1
fi
cd "$WORKDIR"

# 3. 拉取最新代码，切换分支
echo "切换到分支: $VERSION"
git fetch origin
git checkout "$VERSION"
git pull origin "$VERSION"

# 4. 进入 traefik 目录
cd traefik || { echo "目录不存在: traefik"; exit 1; }

# 5. 加载环境变量
if [ -f ./config_env_staging.sh ]; then
  source ./config_env_staging.sh
else
  echo "找不到环境配置文件 config_env_staging.sh"
  exit 1
fi

# 6. 关闭已有容器并删除卷
echo "停止并移除 traefik 服务容器..."
docker compose -f docker-compose.traefik.yml down -v

# 7. 启动容器
echo "启动 traefik 容器服务..."
docker compose -f docker-compose.traefik.yml up -d

echo "部署完成：版本 $VERSION"