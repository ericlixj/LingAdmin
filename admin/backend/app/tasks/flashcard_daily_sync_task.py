"""
Flashcard 每日定时同步任务
每日凌晨 1:00 执行，为所有 Flashcard 类型的学习记录补充新的知识点到 flashcard_progress
"""
import logging
from datetime import date, timedelta
from sqlmodel import Session, select
from sqlalchemy import func, and_

from app.core.db import engine
from app.models.studySession import StudySession
from app.models.studySessionItem import StudySessionItem
from app.crud.flashcardProgress_crud import StudyFlashcardProgressCRUD
from app.models.flashcardProgress import StudyFlashcardProgress, StudyFlashcardProgressCreate

init_logger = None
try:
    from app.core.logger import init_logger
except ImportError:
    pass

if init_logger:
    init_logger()

logger = logging.getLogger(__name__)


def flashcard_daily_sync_task(practice_date: date = None):
    """
    每日定时任务：为所有 Flashcard 类型的学习记录补充新的知识点到 flashcard_progress
    
    核心前提（必须严格遵守）：
    
    前提1：flashcard_progress 的唯一性
    - (user_id, session_item_id) UNIQUE
    - 定时任务只能创建一次
    - 学习过程只能更新
    
    前提2：定时任务只做"补充"，不做"回算"
    - 不改已有 progress
    - 不看 next_review_date
    - 不看 create_time
    - 只看「是否已存在 progress」
    
    业务逻辑：
    1. 查找所有 Flashcard 类型的 study_session（mode == "flashcard"，不区分大小写）
    2. 对于每个 session：
       - 获取 user_id, exam_id, daily_new_limit
       - 如果 daily_new_limit 为 None 或 <= 0，跳过
       - 获取该用户已创建 progress 的 session_item_id 集合（针对该 exam_id）
       - 从该 session 的 session_item 中，找出未学习的（不在已创建 progress 集合中的）
       - 按照 daily_new_limit 限制，创建新的 flashcard_progress 记录
       - 新记录的初始值：interval_days = 1, next_review_date = practice_date（传入的日期），state = "new"（新增，尚未开始学习）
    
    重要说明：
    - 定时任务只检查「是否已存在 progress」，不检查 next_review_date 或 create_time
    - 定时任务不修改已有 progress，只创建新的 progress
    - next_review_date 设置为传入的 practice_date（如 2025-01-05 00:00:00）
    - 每日限制通过 daily_new_limit 参数控制，不基于已创建数量判断
    
    幂等性保证：
    - 通过唯一性约束 (user_id, session_item_id) UNIQUE 保证
    - 创建前检查是否已存在 progress
    - 捕获唯一约束冲突异常，确保幂等性
    
    Args:
        practice_date: 练习日期，默认为系统当前日期。新创建的记录的 next_review_date 将设置为该日期
    """
    try:
        # 如果没有提供日期，使用当前日期
        if practice_date is None:
            practice_date = date.today()
        
        logger.info("=" * 60)
        logger.info(f"Starting Flashcard daily sync task (practice_date: {practice_date})")
        logger.info("=" * 60)
        total_sessions_processed = 0
        total_new_progress_created = 0
        total_errors = 0
        total_flashcard_sessions = 0
        
        # 使用独立的数据库会话
        with Session(engine) as session:
            # 查找所有 Flashcard 类型的 study_session
            flashcard_sessions = session.exec(
                select(StudySession).where(
                    StudySession.mode.isnot(None),
                    StudySession.deleted == False
                )
            ).all()
            
            # 过滤出 mode 为 "flashcard"（不区分大小写）的 session
            flashcard_sessions = [
                s for s in flashcard_sessions 
                if s.mode and s.mode.lower() == "flashcard"
            ]
            
            total_flashcard_sessions = len(flashcard_sessions)
            logger.info(f"Found {total_flashcard_sessions} Flashcard sessions to process")
            
            if not flashcard_sessions:
                logger.info("No Flashcard sessions found, task completed")
                return
            
            # 打印所有找到的 session 信息，用于调试
            for s in flashcard_sessions:
                logger.info(
                    f"  - Session ID: {s.id}, User ID: {s.user_id}, Exam ID: {s.exam_id}, "
                    f"Mode: {s.mode}, Daily New Limit: {s.daily_new_limit}"
                )
            
            # 处理每个 session
            for session_obj in flashcard_sessions:
                try:
                    user_id = session_obj.user_id
                    exam_id = session_obj.exam_id
                    daily_new_limit = session_obj.daily_new_limit
                    
                    # 跳过无效的 session
                    if not user_id or not exam_id:
                        logger.warning(
                            f"Skipping session {session_obj.id}: missing user_id or exam_id "
                            f"(user_id={user_id}, exam_id={exam_id})"
                        )
                        continue
                    
                    # 跳过 daily_new_limit 为 None 或 <= 0 的 session
                    if not daily_new_limit or daily_new_limit <= 0:
                        logger.debug(
                            f"Skipping session {session_obj.id}: daily_new_limit is {daily_new_limit}"
                        )
                        continue
                    
                    logger.info(
                        f"Processing session {session_obj.id}: "
                        f"user_id={user_id}, exam_id={exam_id}, daily_new_limit={daily_new_limit}"
                    )
                    
                    # 创建 CRUD 实例
                    crud = StudyFlashcardProgressCRUD(session, user_id=user_id, dept_id=session_obj.dept_id or 0)
                    
                    # 前提2：定时任务只做"补充"，不做"回算"
                    # - 不改已有 progress
                    # - 只看「是否已存在 progress」
                    # 但是需要检查每日数量限制：不能超过session中设定的每日学习数量
                    # 限制条件：next_review_date == practice_date 且 state='new'（新增）的数量不能超过 daily_new_limit
                    
                    # 检查今天（基于practice_date）且 state='new'（新增）的记录数量
                    # 用于限制每日创建数量，不能超过daily_new_limit
                    new_state_count = session.exec(
                        select(func.count(StudyFlashcardProgress.id)).where(
                            and_(
                                StudyFlashcardProgress.user_id == user_id,
                                StudyFlashcardProgress.exam_id == exam_id,
                                StudyFlashcardProgress.deleted == False,
                                StudyFlashcardProgress.next_review_date == practice_date,  # 日期条件
                                StudyFlashcardProgress.state == "new"  # 只统计 state='new'（新增）的数量
                            )
                        )
                    ).one()
                    
                    logger.info(
                        f"User {user_id}, Exam {exam_id}: Today ({practice_date}) state='new' (新增) count: {new_state_count}, "
                        f"daily limit: {daily_new_limit}"
                    )
                    
                    # 如果 state='new'（新增）的数量 >= daily_new_limit，不再创建新的
                    if new_state_count >= daily_new_limit:
                        logger.info(
                            f"Skipping session {session_obj.id}: Already reached daily limit for state='new' "
                            f"({new_state_count}/{daily_new_limit}) on {practice_date}"
                        )
                        total_sessions_processed += 1
                        continue
                    
                    # 计算还可以创建的数量
                    remaining_limit = daily_new_limit - new_state_count
                    logger.info(
                        f"Session {session_obj.id}: Can create {remaining_limit} more progress records today "
                        f"(remaining: {remaining_limit}/{daily_new_limit})"
                    )
                    
                    # 获取该用户已创建 progress 的 session_item_id 集合（针对该 exam_id）
                    # 这是判断"是否已存在 progress"的唯一标准
                    existing_session_item_ids = crud.get_user_progress_session_item_ids(user_id, exam_id)
                    logger.debug(
                        f"User {user_id} already has {len(existing_session_item_ids)} progress records "
                        f"for exam {exam_id} (session_item_ids with existing progress)"
                    )
                    
                    # 从该 session 的 session_item 中，找出未学习的（不存在 progress 的）
                    query = select(StudySessionItem).where(
                        StudySessionItem.session_id == session_obj.id,
                        StudySessionItem.deleted == False
                    )
                    # 排除已有 progress 的 session_item（这是唯一判断标准）
                    if existing_session_item_ids:
                        query = query.where(~StudySessionItem.id.in_(existing_session_item_ids))
                    
                    # 先查询总数，用于日志
                    total_session_items = session.exec(
                        select(StudySessionItem).where(
                            StudySessionItem.session_id == session_obj.id,
                            StudySessionItem.deleted == False
                        )
                    ).all()
                    logger.info(
                        f"Session {session_obj.id}: Total session_items={len(total_session_items)}, "
                        f"Already have progress={len(existing_session_item_ids)}, "
                        f"Can create progress for={len(total_session_items) - len(existing_session_item_ids)}"
                    )
                    
                    # 按剩余可创建数量限制，而不是 daily_new_limit
                    session_items = session.exec(query.limit(remaining_limit)).all()
                    
                    if not session_items:
                        logger.warning(
                            f"No new session items found for session {session_obj.id}. "
                            f"Total session_items: {len(total_session_items)}, "
                            f"Already have progress: {len(existing_session_item_ids)}"
                        )
                        total_sessions_processed += 1
                        continue
                    
                    logger.info(
                        f"Found {len(session_items)} new session items to create progress for "
                        f"(limit: {daily_new_limit})"
                    )
                    
                    # 为新的 session_item 创建 progress
                    # 前提1：flashcard_progress 的唯一性 (user_id, session_item_id) UNIQUE
                    # - 定时任务只能创建一次
                    # - 学习过程只能更新
                    # 前提2：定时任务只做"补充"，不做"回算"
                    # - 不改已有 progress
                    # - 只看「是否已存在 progress」
                    # 但是需要检查每日数量限制：不能超过session中设定的每日学习数量
                    created_count = 0
                    skipped_count = 0
                    for session_item in session_items:
                        # 在循环中再次检查今天且 state='new'（新增）的数量，确保不超过每日限制
                        current_new_state_count = session.exec(
                            select(func.count(StudyFlashcardProgress.id)).where(
                                and_(
                                    StudyFlashcardProgress.user_id == user_id,
                                    StudyFlashcardProgress.exam_id == exam_id,
                                    StudyFlashcardProgress.deleted == False,
                                    StudyFlashcardProgress.next_review_date == practice_date,  # 日期条件
                                    StudyFlashcardProgress.state == "new"  # 只统计 state='new'（新增）的数量
                                )
                            )
                        ).one()
                        
                        if current_new_state_count >= daily_new_limit:
                            logger.info(
                                f"Reached daily limit for state='new' ({current_new_state_count}/{daily_new_limit}) "
                                f"for user {user_id}, exam {exam_id} on {practice_date}, stopping creation"
                            )
                            break  # 跳出循环，不再创建
                        
                        try:
                            # 幂等性检查：在创建前再次检查是否已存在（防止并发情况）
                            # 这是唯一判断标准：是否已存在 progress
                            existing_progress = crud.get_by_user_and_session_item(user_id, session_item.id)
                            if existing_progress:
                                skipped_count += 1
                                logger.debug(
                                    f"Progress already exists for user_id={user_id}, "
                                    f"session_item_id={session_item.id} (progress_id={existing_progress.id}), skipping"
                                )
                                continue
                            
                            # 创建新的 progress 记录
                            # next_review_date 设置为传入的 practice_date（当天），而不是 practice_date + 1
                            # 这样新创建的记录会在当天就可以被学习
                            # state 设置为 "new"，代表新增，尚未开始学习
                            progress_create = StudyFlashcardProgressCreate(
                                user_id=user_id,
                                session_item_id=session_item.id,
                                exam_id=exam_id,
                                interval_days=1,
                                next_review_date=practice_date,  # 设置为当天，而不是 practice_date + 1
                                state="new",  # 新增状态，尚未开始学习
                                creator=str(user_id),
                                dept_id=session_obj.dept_id or 0,
                            )
                            
                            # 幂等性检查 2: 创建后立即验证，如果因为并发导致重复，捕获异常
                            try:
                                created_progress = crud.create(progress_create)
                                created_count += 1
                                logger.info(
                                    f"✓ Created progress for session_item_id={session_item.id}, "
                                    f"progress_id={created_progress.id}, "
                                    f"next_review_date={created_progress.next_review_date}"
                                )
                            except Exception as create_error:
                                # 幂等性检查 3: 如果创建失败，可能是唯一约束冲突（如果将来添加了唯一约束）
                                # 或者并发创建导致的重复，再次检查确认
                                error_str = str(create_error).lower()
                                if "unique" in error_str or "duplicate" in error_str or "already exists" in error_str:
                                    # 可能是并发创建导致的，再次检查
                                    existing_progress_retry = crud.get_by_user_and_session_item(user_id, session_item.id)
                                    if existing_progress_retry:
                                        skipped_count += 1
                                        logger.info(
                                            f"Progress was created concurrently for user_id={user_id}, "
                                            f"session_item_id={session_item.id} (progress_id={existing_progress_retry.id}), "
                                            f"skipping (idempotent behavior)"
                                        )
                                        continue
                                
                                # 如果是其他错误，重新抛出
                                raise
                                
                        except Exception as e:
                            logger.error(
                                f"✗ Error creating progress for session_item_id={session_item.id}: {e}",
                                exc_info=True
                            )
                            total_errors += 1
                            # 继续处理下一个 session_item
                            continue
                    
                    if skipped_count > 0:
                        logger.info(
                            f"Session {session_obj.id}: skipped {skipped_count} session_items "
                            f"(already have progress, idempotent behavior)"
                        )
                    
                    total_new_progress_created += created_count
                    total_sessions_processed += 1
                    
                    logger.info(
                        f"Session {session_obj.id} processed: created {created_count} new progress records, "
                        f"skipped {skipped_count} (already exist, idempotent)"
                    )
                    
                except Exception as e:
                    logger.error(
                        f"Error processing session {session_obj.id}: {e}",
                        exc_info=True
                    )
                    total_errors += 1
                    # 继续处理下一个 session
                    continue
        
        logger.info("=" * 60)
        logger.info("Flashcard daily sync task completed")
        logger.info(f"  - Total Flashcard sessions found: {total_flashcard_sessions}")
        logger.info(f"  - Sessions processed: {total_sessions_processed}")
        logger.info(f"  - New progress records created: {total_new_progress_created}")
        logger.info(f"  - Errors: {total_errors}")
        if total_new_progress_created == 0 and total_sessions_processed > 0:
            logger.warning(
                "  ⚠️  No progress records were created. Possible reasons: "
                "1) No session_items in the sessions (need to sync knowledge points first), "
                "2) All session_items already have progress, "
                "3) daily_new_limit is 0 or not set"
            )
        elif total_new_progress_created == 0 and total_flashcard_sessions == 0:
            logger.warning(
                "  ⚠️  No Flashcard sessions found. Make sure you have created Flashcard type study sessions."
            )
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error in flashcard_daily_sync_task: {e}", exc_info=True)
        raise
