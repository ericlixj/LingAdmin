#!/usr/bin/env python3
"""
导入题目到 learning_item 表

将指定 ID 范围的题目（study_question）插入到 study_learning_item 表中
"""

import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyLearningItem import StudyLearningItem


def import_questions_to_learning_item(start_id: int, end_id: int, user_id: int, dry_run: bool = False):
    """
    将指定 ID 范围的题目插入到 learning_item 表
    
    Args:
        start_id: 起始题目 ID（包含）
        end_id: 结束题目 ID（包含）
        user_id: 用户 ID（用于 creator 字段）
        dry_run: 是否只是预览，不实际插入
    """
    print("=" * 60)
    print("导入题目到 learning_item 表")
    print("=" * 60)
    print(f"题目 ID 范围: {start_id} - {end_id}")
    print(f"用户 ID: {user_id}")
    print(f"模式: {'预览模式（不会实际插入）' if dry_run else '执行模式'}")
    print("=" * 60)
    
    with Session(engine) as session:
        # 查询指定 ID 范围的题目
        stmt = select(StudyQuestion).where(
            StudyQuestion.id >= start_id,
            StudyQuestion.id <= end_id,
            StudyQuestion.status == 1  # 只导入启用状态的题目
        )
        
        questions = session.exec(stmt.order_by(StudyQuestion.id)).all()
        print(f"\n找到 {len(questions)} 道题目（ID: {start_id}-{end_id}，status=1）")
        
        if not questions:
            print("没有找到符合条件的题目")
            return
        
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
        
        print(f"\n需要插入: {len(to_insert)} 道题目")
        print(f"已存在（跳过）: {len(skipped)} 道题目")
        
        if skipped:
            print(f"\n已存在的题目 ID: {sorted(skipped)[:20]}{'...' if len(skipped) > 20 else ''}")
        
        if not to_insert:
            print("\n✅ 所有题目都已存在于 learning_item 表中")
            return
        
        if dry_run:
            print("\n[DRY RUN] 以下题目将被插入（前20道）:")
            for i, q in enumerate(to_insert[:20], 1):
                stem_preview = q.stem[:50] + '...' if len(q.stem) > 50 else q.stem
                print(f"  {i}. Question ID={q.id}, exam_id={q.exam_id}: {stem_preview}")
            if len(to_insert) > 20:
                print(f"  ... 还有 {len(to_insert) - 20} 道")
            return
        
        # 执行插入
        print(f"\n正在插入 {len(to_insert)} 道题目到 learning_item 表...")
        inserted_count = 0
        
        for q in to_insert:
            new_item = StudyLearningItem(
                type="question",
                ref_id=q.id,
                creator=str(user_id),
                dept_id=0,
                deleted=False,
                is_favorited=False,
                create_time=datetime.now(timezone.utc).replace(tzinfo=None),
                update_time=datetime.now(timezone.utc).replace(tzinfo=None),
            )
            session.add(new_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                print(f"  已插入 {inserted_count}/{len(to_insert)} 道...")
        
        session.commit()
        
        print(f"\n✅ 完成!")
        print(f"  插入: {inserted_count} 道题目到 learning_item 表")
        print(f"  跳过: {len(skipped)} 道已存在的题目")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="导入题目到 learning_item 表")
    parser.add_argument("--start-id", "-s", type=int, required=True, help="起始题目 ID（包含）")
    parser.add_argument("--end-id", "-e", type=int, required=True, help="结束题目 ID（包含）")
    parser.add_argument("--user-id", "-u", type=int, required=True, help="用户 ID（用于 creator 字段）")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只预览不实际插入")
    
    args = parser.parse_args()
    
    if args.start_id > args.end_id:
        print("❌ 错误: start_id 不能大于 end_id")
        sys.exit(1)
    
    import_questions_to_learning_item(
        start_id=args.start_id,
        end_id=args.end_id,
        user_id=args.user_id,
        dry_run=args.dry_run
    )
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
