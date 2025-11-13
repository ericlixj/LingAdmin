# capp/frontend/Dockerfile

########################
# 1️⃣ Build stage
########################
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

# 从 docker-compose 传进来
ARG VITE_API_URL
ARG NODE_ENV=production

ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=${NODE_ENV}

RUN npm run build


########################
# 2️⃣ Runtime stage (Nginx)
########################
FROM nginx:alpine

# 删除默认配置，换成我们自己的（支持 SPA）
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置（下面有示例）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 前端构建产物
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
