#!/bin/bash

# 生产环境部署脚本
# 目录结构：
#   /deploy/scripts  - 部署脚本位置（本脚本所在目录）
#   /deploy/current  - 当前运行的代码
#   /deploy/releases - 备份目录（保留最近3次）
#
# 注意：此脚本明确指定只使用 docker-compose.yml，不会加载 docker-compose.override.yml

set -e  # 遇到错误立即退出

# ========================================
# 配置区域
# ========================================
DEPLOY_BASE="/root/deploy"
CURRENT_DIR="$DEPLOY_BASE/current"
RELEASES_DIR="$DEPLOY_BASE/releases"
SCRIPTS_DIR="$DEPLOY_BASE/scripts"

# Git 仓库配置
GIT_REPO="https://github.com/ericlixj/LingAdmin.git"  # 修改为你的仓库地址
GIT_BRANCH="fullstack-ai"  # 修改为你的分支

# Docker compose 文件
COMPOSE_FILE="docker-compose.yml"

# 备份保留数量
MAX_RELEASES=3

# 时间戳格式
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# ========================================
# 函数定义
# ========================================

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
}

# 初始化目录结构
init_directories() {
    log_info "检查并创建目录结构..."
    
    for dir in "$CURRENT_DIR" "$RELEASES_DIR" "$SCRIPTS_DIR"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "创建目录: $dir"
        fi
    done
}

# 备份当前版本
backup_current() {
    if [ -d "$CURRENT_DIR" ] && [ "$(ls -A $CURRENT_DIR 2>/dev/null)" ]; then
        BACKUP_NAME="release_${TIMESTAMP}"
        BACKUP_PATH="$RELEASES_DIR/$BACKUP_NAME"
        
        log_info "备份当前版本到: $BACKUP_PATH"
        
        # 停止当前服务（如果正在运行）
        if [ -f "$CURRENT_DIR/$COMPOSE_FILE" ]; then
            log_info "停止当前运行的服务..."
            cd "$CURRENT_DIR"
            docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
            cd - > /dev/null
        fi
        
        # 移动当前目录到备份
        mv "$CURRENT_DIR" "$BACKUP_PATH"
        mkdir -p "$CURRENT_DIR"
        
        log_success "备份完成: $BACKUP_NAME"
    else
        log_warning "当前目录为空，跳过备份"
    fi
}

# 清理旧备份（保留最近N个）
cleanup_old_releases() {
    log_info "清理旧备份（保留最近 $MAX_RELEASES 个）..."
    
    # 获取所有备份目录，按时间排序（最新的在前）
    RELEASE_COUNT=$(ls -1d "$RELEASES_DIR"/release_* 2>/dev/null | wc -l)
    
    if [ "$RELEASE_COUNT" -gt "$MAX_RELEASES" ]; then
        # 获取要删除的备份数量
        DELETE_COUNT=$((RELEASE_COUNT - MAX_RELEASES))
        
        # 删除最旧的备份
        ls -1dt "$RELEASES_DIR"/release_* | tail -n "$DELETE_COUNT" | while read old_release; do
            log_info "删除旧备份: $(basename $old_release)"
            rm -rf "$old_release"
        done
        
        log_success "已清理 $DELETE_COUNT 个旧备份"
    else
        log_info "当前备份数量: $RELEASE_COUNT，无需清理"
    fi
}

# 拉取最新代码
pull_latest_code() {
    log_info "拉取最新代码..."
    
    cd "$CURRENT_DIR"
    
    if [ -d ".git" ]; then
        # 已存在 git 仓库，直接拉取
        log_info "更新现有仓库..."
        git fetch origin
        git reset --hard "origin/$GIT_BRANCH"
        git clean -fd
    else
        # 克隆新仓库
        log_info "克隆仓库: $GIT_REPO (分支: $GIT_BRANCH)"
        cd "$DEPLOY_BASE"
        rm -rf "$CURRENT_DIR"
        git clone -b "$GIT_BRANCH" "$GIT_REPO" current
        cd "$CURRENT_DIR"
    fi
    
    # 显示当前版本信息
    COMMIT_HASH=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=format:"%s")
    COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")
    COMMIT_DATE=$(git log -1 --pretty=format:"%ar")
    
    log_success "代码拉取完成"
    echo ""
    echo "  📝 版本信息:"
    echo "     提交: $COMMIT_HASH"
    echo "     信息: $COMMIT_MSG"
    echo "     作者: $COMMIT_AUTHOR"
    echo "     时间: $COMMIT_DATE"
    echo ""
}

# 加载环境变量
load_env() {
    log_info "加载生产环境变量..."
    
    if [ -f "$CURRENT_DIR/traefik/config_env_production.sh" ]; then
        source "$CURRENT_DIR/traefik/config_env_production.sh"
        log_success "环境变量加载完成"
        echo "     DOMAIN: $DOMAIN"
        echo "     EMAIL: $EMAIL"
    else
        log_error "找不到环境配置文件: traefik/config_env_production.sh"
        exit 1
    fi
}

# 检查并创建网络
setup_network() {
    log_info "检查 Docker 网络..."
    
    if ! docker network ls | grep -q "traefik-public"; then
        docker network create traefik-public
        log_success "创建 traefik-public 网络"
    else
        log_info "traefik-public 网络已存在"
    fi
}

# 启动 Traefik
start_traefik() {
    log_info "检查 Traefik 状态..."
    
    cd "$CURRENT_DIR"
    
    if ! docker compose -f traefik/docker-compose.traefik.yml ps 2>/dev/null | grep -q "Up"; then
        log_info "启动 Traefik..."
        docker compose -f traefik/docker-compose.traefik.yml up -d
        sleep 5
        log_success "Traefik 启动完成"
    else
        log_info "Traefik 已在运行"
    fi
}

# 构建并启动服务
build_and_start() {
    cd "$CURRENT_DIR"
    
    log_info "构建 Docker 镜像..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
    log_success "镜像构建完成"
    
    log_info "启动服务..."
    docker compose -f "$COMPOSE_FILE" up -d
    log_success "服务启动命令已执行"
    
    log_info "等待服务启动（30秒）..."
    sleep 30
}

# 显示服务状态
show_status() {
    cd "$CURRENT_DIR"
    
    echo ""
    echo "=========================================="
    echo "📊 服务状态"
    echo "=========================================="
    docker compose -f "$COMPOSE_FILE" ps
    
    echo ""
    echo "=========================================="
    echo "🌐 服务访问地址"
    echo "=========================================="
    echo "📊 Traefik Dashboard: https://traefik.${DOMAIN}"
    echo "🔧 Adminer: https://adminer.${DOMAIN}"
    echo "🚀 API: https://api.${DOMAIN}"
    echo "📱 Dashboard: https://dashboard.${DOMAIN}"
    echo "🔍 OpenSearch: https://opensearch.${DOMAIN}"
    
    echo ""
    echo "=========================================="
    echo "📝 常用命令"
    echo "=========================================="
    echo "查看日志: cd $CURRENT_DIR && docker compose -f $COMPOSE_FILE logs -f"
    echo "重启服务: cd $CURRENT_DIR && docker compose -f $COMPOSE_FILE restart"
    echo "停止服务: cd $CURRENT_DIR && docker compose -f $COMPOSE_FILE down"
    echo ""
}

# 显示备份列表
show_releases() {
    echo ""
    echo "=========================================="
    echo "📦 备份列表"
    echo "=========================================="
    if [ -d "$RELEASES_DIR" ] && [ "$(ls -A $RELEASES_DIR 2>/dev/null)" ]; then
        ls -1dt "$RELEASES_DIR"/release_* 2>/dev/null | while read release; do
            echo "  - $(basename $release)"
        done
    else
        echo "  （无备份）"
    fi
    echo ""
}

# 回滚到指定版本
rollback() {
    local target_release="$1"
    
    if [ -z "$target_release" ]; then
        echo "用法: $0 rollback <release_name>"
        echo ""
        show_releases
        exit 1
    fi
    
    local release_path="$RELEASES_DIR/$target_release"
    
    if [ ! -d "$release_path" ]; then
        log_error "备份不存在: $target_release"
        show_releases
        exit 1
    fi
    
    log_info "回滚到版本: $target_release"
    
    # 停止当前服务
    if [ -f "$CURRENT_DIR/$COMPOSE_FILE" ]; then
        cd "$CURRENT_DIR"
        docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    fi
    
    # 备份当前版本（如果有内容）
    if [ -d "$CURRENT_DIR" ] && [ "$(ls -A $CURRENT_DIR 2>/dev/null)" ]; then
        ROLLBACK_BACKUP="$RELEASES_DIR/pre_rollback_${TIMESTAMP}"
        mv "$CURRENT_DIR" "$ROLLBACK_BACKUP"
        log_info "当前版本已备份到: $ROLLBACK_BACKUP"
    fi
    
    # 恢复目标版本
    cp -a "$release_path" "$CURRENT_DIR"
    log_success "版本恢复完成"
    
    # 重新启动服务
    cd "$CURRENT_DIR"
    load_env
    docker compose -f "$COMPOSE_FILE" up -d
    
    log_success "回滚完成！"
    show_status
}

# ========================================
# 主流程
# ========================================

main() {
    echo ""
    echo "=========================================="
    echo "🚀 生产环境部署开始"
    echo "=========================================="
    echo "📅 时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "📂 部署目录: $CURRENT_DIR"
    echo "📄 配置文件: $COMPOSE_FILE"
    echo ""
    
    # 1. 初始化目录
    init_directories
    
    # 2. 备份当前版本
    backup_current
    
    # 3. 清理旧备份
    cleanup_old_releases
    
    # 4. 拉取最新代码
    pull_latest_code
    
    # 5. 加载环境变量
    load_env
    
    # 6. 设置网络
    setup_network
    
    # 7. 启动 Traefik
    start_traefik
    
    # 8. 构建并启动服务
    build_and_start
    
    # 9. 显示状态
    show_status
    
    # 10. 显示备份列表
    show_releases
    
    log_success "🎉 部署完成！"
    echo ""
}

# ========================================
# 命令行参数处理
# ========================================

case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback "$2"
        ;;
    status)
        cd "$CURRENT_DIR" 2>/dev/null && show_status || log_error "未找到部署目录"
        ;;
    releases)
        show_releases
        ;;
    cleanup)
        cleanup_old_releases
        ;;
    *)
        echo "用法: $0 {deploy|rollback <release>|status|releases|cleanup}"
        echo ""
        echo "命令:"
        echo "  deploy          - 执行完整部署流程（默认）"
        echo "  rollback <name> - 回滚到指定版本"
        echo "  status          - 显示当前服务状态"
        echo "  releases        - 显示备份列表"
        echo "  cleanup         - 清理旧备份"
        exit 1
        ;;
esac
