#!/bin/bash

# 1. 检查参数
if [ -z "$1" ]; then
  echo "错误：请提供版本号参数（对应 Git 分支名）"
  echo "用法: ./deploy_cacdw.sh <版本号>"
  exit 1
fi

VERSION=$1
WORKDIR="/root/deploy/work/LingAdmin"

echo "开始部署版本：$VERSION"
cd "$WORKDIR" || { echo "目录不存在: $WORKDIR"; exit 1; }

# 2. 更新代码
echo "执行 git pull 拉取最新代码..."
rm -f .env
git pull origin "$VERSION"

# 3. 切换分支
echo "切换到分支: $VERSION"
git checkout "$VERSION"

# 4. 覆盖环境变量文件
echo "使用 .env.staging 替换 .env"
cp -f .env.staging .env

# ✅ 5. 构建服务镜像
echo "构建服务镜像..."
docker compose down
docker compose -f docker-compose.yml build --no-cache

# 6. 启动容器
echo "启动容器服务..."
docker compose -f docker-compose.yml up -d

echo "部署完成：版本 $VERSION"