#!/usr/bin/env python3
"""
初始化 study_learning_item 表
将 knowledge 和 question 数据导入
"""

import sys
from datetime import datetime, timezone

from sqlmodel import Session, select, text

# 添加项目路径
sys.path.insert(0, str(__file__).rsplit("/app/", 1)[0])

from app.core.db import engine
from app.models.studyKnowledgeNode import StudyKnowledgeNode
from app.models.studyQuestion import StudyQuestion
from app.models.studyLearningItem import StudyLearningItem


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="初始化学习项目表")
    parser.add_argument("--clear", action="store_true", help="清空现有数据后再导入")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只显示不实际执行")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("初始化 study_learning_item 表")
    print("=" * 60)
    
    with Session(engine) as session:
        # 统计现有数据
        existing_count = session.exec(
            select(StudyLearningItem).where(StudyLearningItem.deleted == False)
        ).all()
        print(f"📊 现有学习项目: {len(existing_count)} 条")
        
        if args.clear and not args.dry_run:
            # 软删除现有数据
            session.exec(text("UPDATE study_learning_item SET deleted = true"))
            session.commit()
            print("🗑️ 已清空现有数据")
        
        # 获取知识点
        knowledge_nodes = session.exec(
            select(StudyKnowledgeNode).where(StudyKnowledgeNode.deleted == False)
        ).all()
        print(f"\n📚 找到 {len(knowledge_nodes)} 个知识点")
        
        # 获取题目
        questions = session.exec(
            select(StudyQuestion).where(StudyQuestion.deleted == False)
        ).all()
        print(f"📝 找到 {len(questions)} 道题目")
        
        if args.dry_run:
            print("\n[DRY RUN] 将创建以下学习项目:")
            print(f"  - knowledge 类型: {len(knowledge_nodes)} 条")
            print(f"  - question 类型: {len(questions)} 条")
            print(f"  - 总计: {len(knowledge_nodes) + len(questions)} 条")
            return
        
        # 获取已存在的关联（避免重复）
        existing_items = session.exec(
            select(StudyLearningItem).where(StudyLearningItem.deleted == False)
        ).all()
        existing_set = {(item.type, item.ref_id) for item in existing_items}
        
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        created_count = 0
        skipped_count = 0
        
        # 导入知识点
        print("\n🔄 导入知识点...")
        for kn in knowledge_nodes:
            if ("knowledge", kn.id) in existing_set:
                skipped_count += 1
                continue
            
            item = StudyLearningItem(
                type="knowledge",
                ref_id=kn.id,
                creator="system_init",
                create_time=now,
                update_time=now,
            )
            session.add(item)
            created_count += 1
        
        # 导入题目
        print("🔄 导入题目...")
        for q in questions:
            if ("question", q.id) in existing_set:
                skipped_count += 1
                continue
            
            item = StudyLearningItem(
                type="question",
                ref_id=q.id,
                creator="system_init",
                create_time=now,
                update_time=now,
            )
            session.add(item)
            created_count += 1
        
        session.commit()
        
        print(f"\n" + "=" * 60)
        print(f"✅ 完成!")
        print(f"   新建: {created_count} 条")
        print(f"   跳过(已存在): {skipped_count} 条")
        print("=" * 60)


if __name__ == "__main__":
    main()


