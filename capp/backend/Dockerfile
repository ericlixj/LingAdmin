# capp/backend/Dockerfile

FROM node:20-alpine

WORKDIR /app

# 先复制依赖清单，利用缓存
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production || npm install --only=production

# 再复制源码
COPY . .

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "index.js"]
