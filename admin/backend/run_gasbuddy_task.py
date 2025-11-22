#!/usr/bin/env python
"""
手动运行 GasBuddy 爬取任务的脚本
使用方法: python run_gasbuddy_task.py
"""
import sys
import os

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.logger import init_logger
from app.tasks.gasbuddy_crawl_task import gasbuddy_crawl_task
import logging

init_logger()
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("手动启动 GasBuddy 爬取任务")
    logger.info("=" * 50)
    
    try:
        gasbuddy_crawl_task()
        logger.info("=" * 50)
        logger.info("任务执行完成")
        logger.info("=" * 50)
    except Exception as e:
        logger.error(f"任务执行失败: {e}", exc_info=True)
        sys.exit(1)



