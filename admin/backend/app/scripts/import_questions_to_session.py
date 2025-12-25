#!/usr/bin/env python3
"""
将所有 question 导入为学习记录明细
"""

import sys
from datetime import datetime, timezone

from sqlmodel import Session, select

# 添加项目路径
sys.path.insert(0, str(__file__).rsplit("/app/", 1)[0])

from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyLearningItem import StudyLearningItem
from app.models.studySessionItem import StudySessionItem


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="导入题目到学习记录明细")
    parser.add_argument("--session-id", "-s", type=int, default=2, help="学习记录ID (默认: 2)")
    parser.add_argument("--user-id", "-u", type=int, default=13, help="用户ID (默认: 13)")
    parser.add_argument("--exam-id", "-e", type=int, default=1, help="考试ID (默认: 1)")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只显示不实际导入")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("导入题目到学习记录明细")
    print("=" * 60)
    print(f"学习记录ID: {args.session_id}")
    print(f"用户ID: {args.user_id}")
    print(f"考试ID: {args.exam_id}")
    print()
    
    with Session(engine) as session:
        # 验证学习记录是否存在
        from app.models.studySession import StudySession
        session_record = session.exec(
            select(StudySession).where(
                StudySession.id == args.session_id,
                StudySession.deleted == False
            )
        ).first()
        
        if not session_record:
            print(f"❌ 错误: 学习记录 ID={args.session_id} 不存在")
            return
        
        print(f"✅ 学习记录存在: ID={session_record.id}")
        print()
        
        # 获取所有题目
        questions = session.exec(
            select(StudyQuestion).where(
                StudyQuestion.exam_id == args.exam_id,
                StudyQuestion.deleted == False
            )
        ).all()
        
        print(f"📝 找到 {len(questions)} 道题目 (exam_id={args.exam_id})")
        
        if args.dry_run:
            print("\n[DRY RUN] 将创建以下明细:")
            for i, q in enumerate(questions[:5], 1):
                print(f"  {i}. Question ID={q.id}: {q.stem[:50]}...")
            if len(questions) > 5:
                print(f"  ... 还有 {len(questions) - 5} 道")
            return
        
        # 获取所有 learning_item (type='question')
        learning_items = session.exec(
            select(StudyLearningItem).where(
                StudyLearningItem.type == "question",
                StudyLearningItem.deleted == False
            )
        ).all()
        
        # 构建 ref_id -> learning_item_id 映射
        learning_item_map = {item.ref_id: item.id for item in learning_items}
        
        print(f"📚 找到 {len(learning_items)} 个 question 类型的学习项目")
        print()
        
        # 检查已存在的明细
        existing_items = session.exec(
            select(StudySessionItem).where(
                StudySessionItem.session_id == args.session_id,
                StudySessionItem.deleted == False
            )
        ).all()
        existing_learning_item_ids = {item.learning_item_id for item in existing_items}
        
        print(f"📊 当前明细数量: {len(existing_items)}")
        print()
        
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        created_count = 0
        skipped_count = 0
        missing_count = 0
        
        print("🔄 开始导入...\n")
        
        for q in questions:
            # 查找对应的 learning_item
            learning_item_id = learning_item_map.get(q.id)
            
            if not learning_item_id:
                print(f"  ⚠️ Question ID={q.id}: 未找到对应的 learning_item")
                missing_count += 1
                continue
            
            # 检查是否已存在
            if learning_item_id in existing_learning_item_ids:
                skipped_count += 1
                continue
            
            # 创建明细
            item = StudySessionItem(
                session_id=args.session_id,
                learning_item_id=learning_item_id,
                is_correct=0,  # 默认否
                response="",  # 默认空字符串
                time_spent_second=0,  # 默认0
                creator="system_import",
                create_time=now,
                update_time=now,
            )
            session.add(item)
            created_count += 1
            
            if created_count % 50 == 0:
                print(f"  已创建 {created_count} 条...", flush=True)
        
        session.commit()
        
        print(f"\n" + "=" * 60)
        print(f"✅ 完成!")
        print(f"   新建: {created_count} 条")
        print(f"   跳过(已存在): {skipped_count} 条")
        print(f"   缺失learning_item: {missing_count} 条")
        print("=" * 60)


if __name__ == "__main__":
    main()


