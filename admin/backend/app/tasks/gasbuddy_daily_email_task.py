"""
GasBuddy 每日定时邮件任务
每天19:00发送当时的油价给所有用户
"""
import logging
import asyncio
from datetime import datetime
from typing import List, Dict
from collections import defaultdict
from sqlmodel import Session, select

from app.core.db import engine
from app.models.user import User
from app.models.userPostcode import UserPostcode
from app.utils.gas_email import (
    get_gas_prices_within_5km,
    generate_multi_postcode_email_content,
)
from app.utils.email_sender import email_sender
from app.crud.gasEmailHistory_crud import GasEmailHistoryCRUD

init_logger = None
try:
    from app.core.logger import init_logger
except ImportError:
    pass

if init_logger:
    init_logger()

logger = logging.getLogger(__name__)


async def send_daily_gas_price_emails():
    """
    每日19:00发送当时的油价给所有用户
    完全异步执行，不影响主流程
    
    规则：
    1. 每天19:00执行
    2. 给所有有邮编的用户发送当前油价
    3. 一个用户多个邮编，聚合到一份邮件中
    4. 记录邮件类型为 'scheduled'
    """
    try:
        logger.info("[DailyEmail] Starting to send daily gas price emails to users...")
        
        # 使用独立的数据库会话，不影响主流程
        with Session(engine) as session:
            email_history_crud = GasEmailHistoryCRUD(session, user_id=1, dept_id=0)
            
            # 获取所有有邮编的用户，按用户分组
            user_postcodes = session.exec(
                select(UserPostcode, User).join(
                    User, UserPostcode.user_id == User.id
                ).where(
                    UserPostcode.deleted == False,
                    UserPostcode.postcode != "",
                    UserPostcode.postcode.isnot(None),
                    User.is_active == True,
                    User.deleted == False,
                    User.email.isnot(None)
                )
            ).all()
            
            if not user_postcodes:
                logger.info("[DailyEmail] No users with postcodes found")
                return
            
            # 按用户分组，一个用户可能有多个邮编，同时保存 label 信息
            user_postcode_map = defaultdict(list)
            user_postcode_label_map = defaultdict(dict)  # 存储每个用户的邮编和 label 映射
            user_map = {}
            
            for user_postcode, user in user_postcodes:
                if not user.email:
                    continue
                
                postcode = user_postcode.postcode
                if not postcode:
                    continue
                
                user_postcode_map[user.id].append(postcode)
                # 保存邮编和 label 的映射
                if user_postcode.label:
                    user_postcode_label_map[user.id][postcode] = user_postcode.label
                user_map[user.id] = user
            
            logger.info(f"[DailyEmail] Found {len(user_map)} users with postcodes")
            
            # 为每个用户发送邮件（聚合所有邮编）
            sent_count = 0
            failed_count = 0
            
            for user_id, postcodes in user_postcode_map.items():
                user = user_map[user_id]
                
                try:
                    # 获取该用户所有邮编的价格数据
                    postcode_data = {}
                    
                    for postcode in postcodes:
                        prices = get_gas_prices_within_5km(postcode, fuel_product=1)
                        if prices:
                            postcode_data[postcode] = prices
                    
                    if not postcode_data:
                        logger.info(f"[DailyEmail] No prices found for user {user.email}")
                        continue
                    
                    # 获取该用户的邮编 label 映射
                    postcode_label_map = user_postcode_label_map.get(user_id, {})
                    
                    # 生成聚合邮件内容（包含所有邮编，按 label 优先级排序）
                    text_content, html_content = generate_multi_postcode_email_content(
                        user.email, postcode_data, postcode_label_map=postcode_label_map, fuel_product_name="Regular Gas"
                    )
                    
                    # 生成邮件主题（每日定时邮件）
                    subject = "LingAdmin系统通知 - 每日油价更新"
                    
                    # 异步发送邮件（不阻塞）
                    await email_sender.send_email(
                        recipients=[user.email],
                        subject=subject,
                        body=text_content,
                        body_html=html_content
                    )
                    
                    # 记录邮件发送历史
                    sent_time = datetime.utcnow()
                    email_history_crud.create_email_record(
                        user_id=user_id,
                        email_type='scheduled',
                        sent_time=sent_time,
                        postcode=None,  # 定时邮件不特定于某个邮编
                        user_id_for_creator=user_id,
                        dept_id=user.dept_id if hasattr(user, 'dept_id') else 0,
                    )
                    
                    sent_count += 1
                    
                    logger.info(
                        f"[DailyEmail] Sent daily gas price email to {user.email} "
                        f"({len(postcode_data)} postcodes)"
                    )
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(
                        f"[DailyEmail] Error sending email to {user.email}: {e}",
                        exc_info=True
                    )
                    # 继续处理下一个用户，不中断流程
                    continue
        
        logger.info(
            f"[DailyEmail] Finished sending daily gas price emails - "
            f"Sent: {sent_count}, Failed: {failed_count}"
        )
        
    except Exception as e:
        logger.error(f"[DailyEmail] Error in send_daily_gas_price_emails: {e}", exc_info=True)
        # 不抛出异常，确保不影响主流程


def gasbuddy_daily_email_task():
    """
    同步包装函数，用于定时任务调度器调用
    """
    try:
        logger.info("=" * 60)
        logger.info("Starting daily gas price email task")
        logger.info("=" * 60)
        
        # 在新的事件循环中运行异步函数
        asyncio.run(send_daily_gas_price_emails())
        
        logger.info("=" * 60)
        logger.info("Daily gas price email task completed")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error in gasbuddy_daily_email_task: {e}", exc_info=True)
        raise

