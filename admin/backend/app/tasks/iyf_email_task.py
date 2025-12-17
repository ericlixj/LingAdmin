"""
IYF 新视频邮件通知任务
当爬取到新视频时，发送邮件提醒给用户
"""
import logging
from typing import List
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlmodel import Session, select

from app.core.db import engine
from app.core.config import settings
from app.core.logger import init_logger
from app.models.user import User
from app.models.userPostcode import UserPostcode
from app.models.iyfEmailHistory import IyfEmailHistoryCreate
from app.crud.iyfEmailHistory_crud import IyfEmailHistoryCRUD
from app.utils.email_sender import email_sender

init_logger()
logger = logging.getLogger(__name__)

# 每封邮件最多包含的新视频数量
MAX_VIDEOS_PER_EMAIL = 10

# 时区
SCHEDULER_TIMEZONE = ZoneInfo(settings.GASBUDDY_SCHEDULER_TIMEZONE)


def get_local_time_str() -> str:
    """获取当前本地时间的格式化字符串"""
    local_time = datetime.now(SCHEDULER_TIMEZONE)
    return local_time.strftime("%Y-%m-%d %H:%M:%S %Z")


def get_subscribed_users() -> List[User]:
    """
    获取订阅用户列表
    基于 user_postcode 表，只给有邮编记录的用户发送邮件
    """
    with Session(engine) as session:
        # 从 user_postcode 表获取有效的用户ID（去重）
        user_ids_query = select(UserPostcode.user_id).where(
            UserPostcode.deleted == False,
            UserPostcode.user_id.isnot(None)
        ).distinct()
        user_ids = session.exec(user_ids_query).all()
        
        if not user_ids:
            logger.warning("[IYF Email] No users found in user_postcode table")
            return []
        
        logger.info(f"[IYF Email] Found {len(user_ids)} users in user_postcode table")
        
        # 根据用户ID获取用户信息（需要有邮箱）
        users = session.exec(
            select(User).where(
                User.id.in_(user_ids),
                User.deleted == False,
                User.email.isnot(None),
                User.email != ""
            )
        ).all()
        return list(users)


def generate_new_video_email_content(videos: List[dict]) -> tuple[str, str]:
    """
    生成新视频邮件内容
    
    Args:
        videos: 新视频列表（字典格式，最多10条）
        
    Returns:
        (text_content, html_content)
    """
    # 限制最多10条
    videos = videos[:MAX_VIDEOS_PER_EMAIL]
    
    # 分类统计
    category_count = {}
    for v in videos:
        cat = v.get("category") or "未知"
        category_count[cat] = category_count.get(cat, 0) + 1
    
    category_summary = ", ".join([f"{cat} {count}部" for cat, count in category_count.items()])
    
    # 生成新增列表
    video_list_text = "\n".join([f"  • {v.get('title', '未知')} ({v.get('category') or '未知'})" for v in videos])
    
    # 文本版本
    text_content = f"""
🎬 爱一帆新上映通知

您好！

IYF 平台有 {len(videos)} 部新视频上线：{category_summary}

📋 新增列表：
{video_list_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"""
    for i, video in enumerate(videos, 1):
        desc = video.get("description") or "暂无简介"
        play_url = video.get("play_url") or ""
        play_link = f"   播放地址: {play_url}\n" if play_url else ""
        text_content += f"""
{i}. {video.get('title', '未知')}
   类型: {video.get('category') or '未知'} | 年份: {video.get('year') or '未知'} | 地区: {video.get('region') or '未知'}
   评分: {video.get('rating') or '暂无'} | 播放量: {video.get('view_count') or 0}
   简介: {desc[:100]}{'...' if len(desc) > 100 else ''}
{play_link}
"""
    
    text_content += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 立即观看: https://www.iyf.tv

更新时间: {get_local_time_str()}
"""
    
    # HTML版本
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e74c3c;
        }}
        .header h1 {{
            color: #e74c3c;
            margin: 0;
            font-size: 28px;
        }}
        .summary {{
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
            text-align: center;
        }}
        .video-card {{
            background: #fafafa;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            display: flex;
            gap: 15px;
            border-left: 4px solid #e74c3c;
        }}
        .video-cover {{
            width: 120px;
            height: 160px;
            object-fit: cover;
            border-radius: 6px;
            flex-shrink: 0;
        }}
        .video-info {{
            flex: 1;
        }}
        .video-title {{
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin: 0 0 8px 0;
        }}
        .video-meta {{
            font-size: 13px;
            color: #7f8c8d;
            margin-bottom: 8px;
        }}
        .video-meta span {{
            margin-right: 15px;
        }}
        .video-desc {{
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }}
        .tag {{
            display: inline-block;
            background: #e74c3c;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-right: 5px;
        }}
        .rating {{
            color: #f39c12;
            font-weight: bold;
        }}
        .footer {{
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #7f8c8d;
            font-size: 13px;
        }}
        .btn {{
            display: inline-block;
            background: #e74c3c;
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
        }}
        .btn:hover {{
            background: #c0392b;
        }}
        .quick-list {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 25px;
        }}
        .quick-list h3 {{
            margin: 0 0 12px 0;
            color: #2c3e50;
            font-size: 16px;
        }}
        .quick-list ul {{
            margin: 0;
            padding-left: 20px;
        }}
        .quick-list li {{
            margin-bottom: 6px;
            color: #555;
        }}
        .quick-list .cat-tag {{
            font-size: 11px;
            color: #7f8c8d;
            margin-left: 5px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 爱一帆新上映通知</h1>
        </div>
        
        <div class="summary">
            <strong>{len(videos)} 部新视频上线</strong><br>
            {category_summary}
        </div>
        
        <div class="quick-list">
            <h3>📋 新增列表</h3>
            <ul>
                {"".join([f'<li>{v.get("title", "未知")} <span class="cat-tag">({v.get("category") or "未知"})</span></li>' for v in videos])}
            </ul>
        </div>
"""
    
    for video in videos:
        cover_html = ""
        cover_url = video.get("cover_url")
        title = video.get("title", "未知")
        if cover_url:
            cover_html = f'<img class="video-cover" src="{cover_url}" alt="{title}">'
        
        desc = (video.get("description") or "暂无简介")[:150]
        if video.get("description") and len(video.get("description", "")) > 150:
            desc += "..."
        
        play_url = video.get("play_url") or ""
        play_button = f'<a href="{play_url}" class="btn" style="display: inline-block; margin-top: 10px; padding: 8px 20px; font-size: 14px;">立即观看 →</a>' if play_url else ""
        
        html_content += f"""
        <div class="video-card">
            {cover_html}
            <div class="video-info">
                <h3 class="video-title">{title}</h3>
                <div class="video-meta">
                    <span class="tag">{video.get('category') or '未知'}</span>
                    <span>📅 {video.get('year') or '未知'}</span>
                    <span>🌍 {video.get('region') or '未知'}</span>
                    <span class="rating">⭐ {video.get('rating') or '暂无'}</span>
                    <span>👁 {video.get('view_count') or 0}</span>
                </div>
                <div class="video-desc">{desc}</div>
                {play_button}
            </div>
        </div>
"""
    
    html_content += f"""
        <div style="text-align: center;">
            <a href="https://www.iyf.tv" class="btn">立即观看 →</a>
        </div>
        
        <div class="footer">
            <p>更新时间: {get_local_time_str()}</p>
            <p>此邮件由系统自动发送，请勿回复</p>
        </div>
    </div>
</body>
</html>
"""
    
    return text_content.strip(), html_content


def send_new_video_emails(new_videos: List[dict], latest_iyf_id: str = None) -> int:
    """
    发送新视频邮件给所有订阅用户，并记录发送历史
    
    Args:
        new_videos: 新视频列表（字典格式）
        latest_iyf_id: 本次爬取的最新视频ID（用于下次比对）
        
    Returns:
        成功发送的邮件数量
    """
    if not new_videos:
        logger.info("[IYF Email] No new videos to notify")
        return 0
    
    # 限制最多10条
    videos_to_send = new_videos[:MAX_VIDEOS_PER_EMAIL]
    
    # 如果没有传入latest_iyf_id，使用第一个视频的ID
    if not latest_iyf_id and videos_to_send:
        latest_iyf_id = videos_to_send[0].get("iyf_id")
    
    logger.info("=" * 60)
    logger.info(f"[IYF Email] Sending new video notification")
    logger.info(f"[IYF Email] New videos count: {len(videos_to_send)}")
    logger.info(f"[IYF Email] Latest iyf_id to record: {latest_iyf_id}")
    logger.info("=" * 60)
    
    # 获取订阅用户
    users = get_subscribed_users()
    if not users:
        logger.warning("[IYF Email] No subscribed users found")
        return 0
    
    logger.info(f"[IYF Email] Found {len(users)} subscribed users")
    
    # 生成邮件内容
    text_content, html_content = generate_new_video_email_content(videos_to_send)
    
    # 分类统计用于邮件标题
    category_count = {}
    for v in videos_to_send:
        cat = v.get("category") or "视频"
        category_count[cat] = category_count.get(cat, 0) + 1
    
    main_category = max(category_count, key=category_count.get) if category_count else "视频"
    first_title = videos_to_send[0].get("title", "新视频")
    subject = f"LingAdmin系统通知-爱一帆新上映{main_category}通知"
    
    # 准备视频信息用于记录
    video_ids = ",".join([v.get("iyf_id", "") for v in videos_to_send if v.get("iyf_id")])
    video_titles = " | ".join([v.get("title", "") for v in videos_to_send if v.get("title")])
    
    # 发送邮件并记录历史
    success_count = 0
    with Session(engine) as session:
        history_crud = IyfEmailHistoryCRUD(session, user_id=1, dept_id=0)
        
        for user in users:
            if not user.email:
                continue
            
            sent_time = datetime.now(SCHEDULER_TIMEZONE)
            error_message = None
            status = "success"
            
            try:
                import asyncio
                # email_sender.send_email 是异步函数
                asyncio.run(email_sender.send_email(
                    recipients=[user.email],
                    subject=subject,
                    body=text_content,
                    body_html=html_content
                ))
                
                success_count += 1
                logger.info(f"[IYF Email] Email sent to {user.email}")
                    
            except Exception as e:
                status = "failed"
                error_message = str(e)
                logger.error(f"[IYF Email] Error sending email to {user.email}: {e}", exc_info=True)
            
            # 记录邮件发送历史
            try:
                history_create = IyfEmailHistoryCreate(
                    user_id=user.id,
                    email=user.email,
                    subject=subject,
                    video_count=len(videos_to_send),
                    video_ids=video_ids,
                    video_titles=video_titles[:500] if video_titles else None,  # 限制长度
                    latest_iyf_id=latest_iyf_id,  # 记录本次最新的视频ID，用于下次比对
                    sent_time=sent_time,
                    status=status,
                    error_message=error_message,
                    creator="system",
                )
                history_crud.create(history_create)
                logger.debug(f"[IYF Email] History recorded for {user.email}, latest_iyf_id: {latest_iyf_id}")
            except Exception as e:
                logger.error(f"[IYF Email] Failed to record history for {user.email}: {e}", exc_info=True)
    
    logger.info("=" * 60)
    logger.info(f"[IYF Email] Email notification completed")
    logger.info(f"[IYF Email] Success: {success_count}/{len(users)}")
    logger.info("=" * 60)
    
    return success_count

