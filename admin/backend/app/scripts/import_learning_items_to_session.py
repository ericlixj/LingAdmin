#!/usr/bin/env python3
"""
将所有 type='question' 的 learning_item 插入到 study_session_item 表中
"""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyLearningItem import StudyLearningItem
from app.models.studySessionItem import StudySessionItem
from app.models.studySession import StudySession


def import_learning_items_to_session(session_id: int = 2, dry_run: bool = False):
    """
    将所有 type='question' 的 learning_item 插入到指定的 session 中
    """
    print("=" * 60)
    print("导入学习抽象层到学习记录明细")
    print("=" * 60)
    print(f"学习记录ID: {session_id}")
    print()
    
    with Session(engine) as session:
        # 验证学习记录是否存在
        session_record = session.exec(
            select(StudySession).where(
                StudySession.id == session_id,
                StudySession.deleted == False
            )
        ).first()
        
        if not session_record:
            print(f"❌ 错误: 学习记录 ID={session_id} 不存在")
            return
        
        print(f"✅ 学习记录存在: ID={session_record.id}, user_id={session_record.user_id}, exam_id={session_record.exam_id}")
        print()
        
        # 获取所有 type='question' 的 learning_item
        learning_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "question",
            StudyLearningItem.deleted == False
        )
        learning_items = session.exec(learning_items_stmt).all()
        
        print(f"📚 找到 {len(learning_items)} 个 question 类型的学习抽象层项目")
        
        if len(learning_items) == 0:
            print("⚠️  没有找到任何 learning_item，请先运行 update_question_refs.py")
            return
        
        # 检查已存在的明细
        existing_items_stmt = select(StudySessionItem).where(
            StudySessionItem.session_id == session_id,
            StudySessionItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        existing_learning_item_ids = {item.learning_item_id for item in existing_items if item.learning_item_id}
        
        print(f"📊 当前明细数量: {len(existing_items)}")
        print(f"📊 已关联的 learning_item: {len(existing_learning_item_ids)} 个")
        print()
        
        if dry_run:
            print("[DRY RUN] 将创建以下明细:")
            new_items = [item for item in learning_items if item.id not in existing_learning_item_ids]
            print(f"  将新增: {len(new_items)} 条明细")
            print(f"  将跳过: {len(learning_items) - len(new_items)} 条已存在的明细")
            
            for i, item in enumerate(new_items[:10], 1):
                print(f"  {i}. learning_item_id={item.id}, ref_id={item.ref_id}")
            if len(new_items) > 10:
                print(f"  ... 还有 {len(new_items) - 10} 条")
            return
        
        # 先物理删除该 session 的所有现有明细
        print(f"\n正在物理删除 session_id={session_id} 的所有现有明细...")
        deleted_count = 0
        for item in existing_items:
            session.delete(item)
            deleted_count += 1
        
        if deleted_count > 0:
            session.commit()
            print(f"  ✅ 已物理删除 {deleted_count} 条记录")
        else:
            print(f"  ✅ 没有需要删除的记录")
        
        # 为每个 learning_item 创建 session_item
        print(f"\n正在插入 {len(learning_items)} 条新明细...")
        inserted_count = 0
        
        for item in learning_items:
            new_session_item = StudySessionItem(
                session_id=session_id,
                learning_item_id=item.id,
                response="",
                time_spent_second=0,
                is_correct=0,
                creator="system",
                updater="system",
                create_time=datetime.utcnow(),
                update_time=datetime.utcnow(),
            )
            session.add(new_session_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                print(f"  已插入 {inserted_count}/{len(learning_items)} 条记录...")
        
        session.commit()
        
        print(f"\n导入完成!")
        print(f"  物理删除: {deleted_count} 条记录")
        print(f"  新插入: {inserted_count} 条记录")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="导入学习抽象层到学习记录明细")
    parser.add_argument("--session-id", "-s", type=int, default=2, help="学习记录ID (默认: 2)")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只显示不实际导入")
    
    args = parser.parse_args()
    
    import_learning_items_to_session(args.session_id, args.dry_run)
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()


