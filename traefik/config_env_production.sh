#!/bin/bash

# 设置基本信息
export USERNAME="admin"
export PASSWORD="G7&kLz!4Xp@9Rf#Q"

# 使用 openssl 生成加密密码（Apache MD5 格式）
export HASHED_PASSWORD=$(openssl passwd -apr1 "$PASSWORD")

# 域名和邮箱
export DOMAIN="kxf.ca"
export EMAIL="ericlixj@gmail.com"

# 输出确认信息（可选）
echo "Configured the following environment variables:"
echo "USERNAME=$USERNAME"
echo "PASSWORD=<hidden>"
echo "HASHED_PASSWORD=$HASHED_PASSWORD"
echo "DOMAIN=$DOMAIN"
echo "EMAIL=$EMAIL"