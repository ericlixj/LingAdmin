#!/usr/bin/env python3
"""
合并脚本：导入题目到 learning_item 表，并将收藏题目插入到 study_session_item 表

支持两种操作：
1. 导入指定 ID 范围的题目到 learning_item 表
2. 将收藏的题目（is_favorited=1）插入到指定用户的 study_session_item 表

可以单独执行某个操作，也可以同时执行两个操作
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyLearningItem import StudyLearningItem
from app.models.studySessionItem import StudySessionItem
from app.models.studySession import StudySession


def import_questions_to_learning_item(session: Session, start_id: int, end_id: int, user_id: int, dry_run: bool = False):
    """
    将指定 ID 范围的题目插入到 learning_item 表
    
    Args:
        session: 数据库会话
        start_id: 起始题目 ID（包含）
        end_id: 结束题目 ID（包含）
        user_id: 用户 ID（用于 creator 字段）
        dry_run: 是否只是预览，不实际插入
    
    Returns:
        tuple: (插入数量, 跳过数量, 新创建的 learning_item 列表)
    """
    print("\n" + "=" * 60)
    print("步骤 1: 导入题目到 learning_item 表")
    print("=" * 60)
    print(f"题目 ID 范围: {start_id} - {end_id}")
    print(f"用户 ID: {user_id}")
    print()
    
    # 查询指定 ID 范围的题目
    stmt = select(StudyQuestion).where(
        StudyQuestion.id >= start_id,
        StudyQuestion.id <= end_id,
        StudyQuestion.status == 1  # 只导入启用状态的题目
    )
    
    questions = session.exec(stmt.order_by(StudyQuestion.id)).all()
    print(f"找到 {len(questions)} 道题目（ID: {start_id}-{end_id}，status=1）")
    
    if not questions:
        print("没有找到符合条件的题目")
        return 0, 0, []
    
    # 检查哪些题目已经存在于 learning_item 中
    existing_ref_ids = set()
    existing_items = session.exec(
        select(StudyLearningItem).where(
            StudyLearningItem.type == "question",
            StudyLearningItem.deleted == False
        )
    ).all()
    
    for item in existing_items:
        if item.ref_id:
            existing_ref_ids.add(item.ref_id)
    
    # 筛选出需要插入的题目
    to_insert = []
    skipped = []
    
    for q in questions:
        if q.id in existing_ref_ids:
            skipped.append(q.id)
        else:
            to_insert.append(q)
    
    print(f"需要插入: {len(to_insert)} 道题目")
    print(f"已存在（跳过）: {len(skipped)} 道题目")
    
    if skipped:
        print(f"已存在的题目 ID: {sorted(skipped)[:20]}{'...' if len(skipped) > 20 else ''}")
    
    if not to_insert:
        print("✅ 所有题目都已存在于 learning_item 表中")
        return 0, len(skipped), []
    
    if dry_run:
        print("\n[DRY RUN] 以下题目将被插入（前20道）:")
        for i, q in enumerate(to_insert[:20], 1):
            stem_preview = q.stem[:50] + '...' if len(q.stem) > 50 else q.stem
            print(f"  {i}. Question ID={q.id}, exam_id={q.exam_id}: {stem_preview}")
        if len(to_insert) > 20:
            print(f"  ... 还有 {len(to_insert) - 20} 道")
        return 0, len(skipped), []
    
    # 执行插入
    print(f"\n正在插入 {len(to_insert)} 道题目到 learning_item 表...")
    inserted_count = 0
    new_learning_items = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    for q in to_insert:
        new_item = StudyLearningItem(
            type="question",
            ref_id=q.id,
            creator=str(user_id),
            dept_id=0,
            deleted=False,
            is_favorited=False,
            create_time=now,
            update_time=now,
        )
        session.add(new_item)
        inserted_count += 1
        new_learning_items.append(new_item)
        
        # 每50条提交一次
        if inserted_count % 50 == 0:
            session.commit()
            print(f"  已插入 {inserted_count}/{len(to_insert)} 道...")
    
    session.commit()
    
    print(f"✅ 完成!")
    print(f"  插入: {inserted_count} 道题目到 learning_item 表")
    print(f"  跳过: {len(skipped)} 道已存在的题目")
    
    return inserted_count, len(skipped), new_learning_items


def import_favorite_questions_to_session(session: Session, user_id: int, session_id: int = None, exam_id: int = 1, dry_run: bool = False):
    """
    将收藏的题目（is_favorited=1）插入到指定用户的 study_session_item 表
    
    Args:
        session: 数据库会话
        user_id: 用户 ID
        session_id: 学习会话 ID（如果为 None，会自动创建或查找）
        exam_id: 考试 ID（用于创建新 session 时）
        dry_run: 是否只是预览，不实际插入
    
    Returns:
        tuple: (插入数量, 跳过数量, session_id)
    """
    print("\n" + "=" * 60)
    print("步骤 2: 导入收藏题目到 study_session_item 表")
    print("=" * 60)
    print(f"用户 ID: {user_id}")
    print()
    
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
            return 0, 0, None
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
            print(f"未找到收藏题库会话，正在创建新的会话...")
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
        return 0, 0, session_id
    
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
        print(f"已存在的 learning_item ID: {sorted(skipped)[:20]}{'...' if len(skipped) > 20 else ''}")
    
    if not to_insert:
        print("✅ 所有收藏题目都已存在于该会话中")
        return 0, len(skipped), session_id
    
    if dry_run:
        print("\n[DRY RUN] 以下收藏题目将被插入（前20个）:")
        for i, item in enumerate(to_insert[:20], 1):
            print(f"  {i}. Learning Item ID={item.id}, Question ref_id={item.ref_id}")
        if len(to_insert) > 20:
            print(f"  ... 还有 {len(to_insert) - 20} 个")
        return 0, len(skipped), session_id
    
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
    
    print(f"✅ 完成!")
    print(f"  插入: {inserted_count} 个收藏题目到 session_item 表")
    print(f"  跳过: {len(skipped)} 个已存在的收藏题目")
    print(f"  会话 ID: {session_id}")
    
    return inserted_count, len(skipped), session_id


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="合并脚本：导入题目到 learning_item 表，并将收藏题目插入到 study_session_item 表",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 只导入题目到 learning_item
  python import_questions_and_favorites.py --user-id 13 --start-id 266 --end-id 335

  # 只导入收藏题目到 session_item
  python import_questions_and_favorites.py --user-id 13 --favorites-only

  # 同时执行两个操作
  python import_questions_and_favorites.py --user-id 13 --start-id 266 --end-id 335 --import-favorites

  # 预览模式
  python import_questions_and_favorites.py --user-id 13 --start-id 266 --end-id 335 --import-favorites --dry-run
        """
    )
    
    parser.add_argument("--user-id", "-u", type=int, required=True, help="用户 ID")
    parser.add_argument("--start-id", "-s", type=int, default=None, help="起始题目 ID（包含），用于导入到 learning_item")
    parser.add_argument("--end-id", "-e", type=int, default=None, help="结束题目 ID（包含），用于导入到 learning_item")
    parser.add_argument("--import-favorites", "-f", action="store_true", help="同时导入收藏题目到 session_item 表")
    parser.add_argument("--favorites-only", action="store_true", help="只导入收藏题目到 session_item 表（不导入题目到 learning_item）")
    parser.add_argument("--session-id", type=int, default=None, help="学习会话 ID（可选，如果不提供会自动查找或创建）")
    parser.add_argument("--exam-id", type=int, default=1, help="考试 ID（创建新 session 时使用，默认: 1）")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只预览不实际插入")
    
    args = parser.parse_args()
    
    # 验证参数
    if args.favorites_only:
        # 只执行收藏题目导入
        do_import_questions = False
        do_import_favorites = True
    elif args.import_favorites:
        # 同时执行两个操作
        do_import_questions = True
        do_import_favorites = True
        if not args.start_id or not args.end_id:
            print("❌ 错误: 使用 --import-favorites 时必须同时指定 --start-id 和 --end-id")
            sys.exit(1)
    else:
        # 只执行题目导入
        do_import_questions = True
        do_import_favorites = False
        if not args.start_id or not args.end_id:
            print("❌ 错误: 必须指定 --start-id 和 --end-id，或使用 --favorites-only")
            sys.exit(1)
    
    if args.start_id and args.end_id and args.start_id > args.end_id:
        print("❌ 错误: start_id 不能大于 end_id")
        sys.exit(1)
    
    print("=" * 60)
    print("合并导入脚本")
    print("=" * 60)
    print(f"用户 ID: {args.user_id}")
    print(f"导入题目到 learning_item: {'是' if do_import_questions else '否'}")
    print(f"导入收藏题目到 session_item: {'是' if do_import_favorites else '否'}")
    print(f"模式: {'预览模式（不会实际插入）' if args.dry_run else '执行模式'}")
    print("=" * 60)
    
    with Session(engine) as session:
        # 步骤 1: 导入题目到 learning_item
        if do_import_questions:
            import_questions_to_learning_item(
                session=session,
                start_id=args.start_id,
                end_id=args.end_id,
                user_id=args.user_id,
                dry_run=args.dry_run
            )
        
        # 步骤 2: 导入收藏题目到 session_item
        if do_import_favorites:
            import_favorite_questions_to_session(
                session=session,
                user_id=args.user_id,
                session_id=args.session_id,
                exam_id=args.exam_id,
                dry_run=args.dry_run
            )
    
    print("\n" + "=" * 60)
    print("全部完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()


