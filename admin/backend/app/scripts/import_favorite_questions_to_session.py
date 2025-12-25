#!/usr/bin/env python3
"""
将收藏的题目（is_favorited=1）插入到指定用户的 study_session_item 表

用于创建收藏题库，方便用户直接练习收藏的题目
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyLearningItem import StudyLearningItem
from app.models.studySessionItem import StudySessionItem
from app.models.studySession import StudySession


def import_favorite_questions_to_session(user_id: int, session_id: int = None, exam_id: int = 1, dry_run: bool = False):
    """
    将收藏的题目（is_favorited=1）插入到指定用户的 study_session_item 表
    
    Args:
        user_id: 用户 ID
        session_id: 学习会话 ID（如果为 None，会自动创建或查找）
        exam_id: 考试 ID（用于创建新 session 时）
        dry_run: 是否只是预览，不实际插入
    """
    print("=" * 60)
    print("导入收藏题目到 study_session_item 表")
    print("=" * 60)
    print(f"用户 ID: {user_id}")
    print(f"模式: {'预览模式（不会实际插入）' if dry_run else '执行模式'}")
    print("=" * 60)
    
    with Session(engine) as session:
        # 查找或创建学习会话
        if session_id:
            # 使用指定的 session_id
            session_record = session.exec(
                select(StudySession).where(
                    StudySession.id == session_id,
                    StudySession.user_id == user_id,
                    StudySession.deleted == False
                )
            ).first()
            
            if not session_record:
                print(f"❌ 错误: 学习会话 ID={session_id} 不存在或不属于用户 {user_id}")
                return
        else:
            # 查找用户已有的收藏题库 session，如果没有则创建
            session_record = session.exec(
                select(StudySession).where(
                    StudySession.user_id == user_id,
                    StudySession.mode == "favorite",
                    StudySession.deleted == False
                ).order_by(StudySession.create_time.desc())
            ).first()
            
            if not session_record:
                # 创建新的收藏题库 session
                print(f"\n未找到收藏题库会话，正在创建新的会话...")
                session_record = StudySession(
                    user_id=user_id,
                    exam_id=exam_id,
                    mode="favorite",
                    start_time="",
                    end_time="",
                    score=None,
                    creator=str(user_id),
                    dept_id=0,
                    deleted=False,
                    create_time=datetime.now(timezone.utc).replace(tzinfo=None),
                    update_time=datetime.now(timezone.utc).replace(tzinfo=None),
                )
                session.add(session_record)
                session.commit()
                session.refresh(session_record)
                print(f"✅ 已创建新的收藏题库会话: ID={session_record.id}")
            else:
                print(f"✅ 找到现有的收藏题库会话: ID={session_record.id}")
        
        session_id = session_record.id
        print(f"使用学习会话 ID: {session_id}")
        print()
        
        # 查找所有收藏的题目（is_favorited=1）
        favorite_items = session.exec(
            select(StudyLearningItem).where(
                StudyLearningItem.type == "question",
                StudyLearningItem.is_favorited == True,
                StudyLearningItem.deleted == False
            )
        ).all()
        
        print(f"📚 找到 {len(favorite_items)} 个收藏的题目（is_favorited=1）")
        
        if not favorite_items:
            print("⚠️  没有找到收藏的题目")
            return
        
        # 检查已存在的 session_item
        existing_items = session.exec(
            select(StudySessionItem).where(
                StudySessionItem.session_id == session_id,
                StudySessionItem.deleted == False
            )
        ).all()
        
        existing_learning_item_ids = {item.learning_item_id for item in existing_items if item.learning_item_id}
        
        print(f"📊 当前会话明细数量: {len(existing_items)}")
        print(f"📊 已关联的 learning_item: {len(existing_learning_item_ids)} 个")
        print()
        
        # 筛选出需要插入的收藏题目
        to_insert = []
        skipped = []
        
        for item in favorite_items:
            if item.id in existing_learning_item_ids:
                skipped.append(item.id)
            else:
                to_insert.append(item)
        
        print(f"需要插入: {len(to_insert)} 个收藏题目")
        print(f"已存在（跳过）: {len(skipped)} 个收藏题目")
        
        if skipped:
            print(f"\n已存在的 learning_item ID: {sorted(skipped)[:20]}{'...' if len(skipped) > 20 else ''}")
        
        if not to_insert:
            print("\n✅ 所有收藏题目都已存在于该会话中")
            return
        
        if dry_run:
            print("\n[DRY RUN] 以下收藏题目将被插入（前20个）:")
            for i, item in enumerate(to_insert[:20], 1):
                print(f"  {i}. Learning Item ID={item.id}, Question ref_id={item.ref_id}")
            if len(to_insert) > 20:
                print(f"  ... 还有 {len(to_insert) - 20} 个")
            return
        
        # 执行插入
        print(f"\n正在插入 {len(to_insert)} 个收藏题目到 session_item 表...")
        inserted_count = 0
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        for item in to_insert:
            new_session_item = StudySessionItem(
                session_id=session_id,
                learning_item_id=item.id,
                is_correct=0,
                response="",
                time_spent_second=0,
                creator=str(user_id),
                dept_id=0,
                deleted=False,
                create_time=now,
                update_time=now,
            )
            session.add(new_session_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                print(f"  已插入 {inserted_count}/{len(to_insert)} 个...")
        
        session.commit()
        
        print(f"\n✅ 完成!")
        print(f"  插入: {inserted_count} 个收藏题目到 session_item 表")
        print(f"  跳过: {len(skipped)} 个已存在的收藏题目")
        print(f"  会话 ID: {session_id}")
        print(f"  用户 ID: {user_id}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="导入收藏题目到 study_session_item 表")
    parser.add_argument("--user-id", "-u", type=int, required=True, help="用户 ID")
    parser.add_argument("--session-id", "-s", type=int, default=None, help="学习会话 ID（可选，如果不提供会自动查找或创建）")
    parser.add_argument("--exam-id", "-e", type=int, default=1, help="考试 ID（创建新 session 时使用，默认: 1）")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只预览不实际插入")
    
    args = parser.parse_args()
    
    import_favorite_questions_to_session(
        user_id=args.user_id,
        session_id=args.session_id,
        exam_id=args.exam_id,
        dry_run=args.dry_run
    )
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()


