#!/bin/bash

# 前往项目根目录
cd ../../ || { echo "目录不存在: ../../"; exit 1; }

# 拷贝生成的代码到根目录
cp -rf backend/codegen/target/single_module/* . || { echo "复制失败"; exit 1; }

echo "代码部署完成，当前停留在项目根目录: $(pwd)"
