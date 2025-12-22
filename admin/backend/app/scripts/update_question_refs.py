#!/usr/bin/env python3
"""
更新学习抽象层和题目知识点关系表，将旧的 question_id 映射到新的 question_id (1-265)
通过 stem 字段匹配旧的 question 和新的 question
"""

import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select, delete
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyLearningItem import StudyLearningItem
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
from app.models.studySession import StudySession
from app.models.studySessionItem import StudySessionItem


def update_learning_items(user_id: int = 13, dry_run: bool = False):
    """
    在学习抽象层中插入所有 question (id 1-265)
    type='question', ref_id=question.id
    """
    print("=" * 60)
    print("更新学习抽象层 (study_learning_item)")
    print("=" * 60)
    
    with Session(engine) as session:
        # 获取所有新的题目 (id 1-265)
        new_questions_stmt = select(StudyQuestion).where(
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        new_questions = session.exec(new_questions_stmt).all()
        
        print(f"找到 {len(new_questions)} 道题目 (ID: {new_questions[0].id if new_questions else 'N/A'} - {new_questions[-1].id if new_questions else 'N/A'})")
        
        # 获取所有现有的 type='question' 的记录
        existing_items_stmt = select(StudyLearningItem).where(
            StudyLearningItem.type == "question",
            StudyLearningItem.deleted == False
        )
        existing_items = session.exec(existing_items_stmt).all()
        
        print(f"找到 {len(existing_items)} 条现有的学习抽象层记录 (type='question')")
        
        if dry_run:
            print("\n[DRY RUN] 将执行以下操作:")
            print(f"  1. 物理删除 {len(existing_items)} 条现有记录")
            print(f"  2. 插入 {len(new_questions)} 条新记录 (ref_id = question.id)")
            print("\n前5条将插入的记录:")
            for i, q in enumerate(new_questions[:5], 1):
                print(f"  {i}. type='question', ref_id={q.id} (stem: {q.stem[:50]}...)")
            if len(new_questions) > 5:
                print(f"  ... 还有 {len(new_questions) - 5} 条记录")
            return
        
        # 先物理删除所有现有的 type='question' 的记录
        print(f"\n正在物理删除所有现有的 type='question' 记录...")
        deleted_count = 0
        for item in existing_items:
            session.delete(item)
            deleted_count += 1
        
        session.commit()
        print(f"  ✅ 已物理删除 {deleted_count} 条记录")
        
        # 为每道题目插入一条 learning_item 记录
        print(f"\n正在插入 {len(new_questions)} 条新记录...")
        inserted_count = 0
        
        for q in new_questions:
            new_item = StudyLearningItem(
                type="question",
                ref_id=q.id,  # ref_id 就是 question 的 id
                creator="system",
                dept_id=0,
                create_time=datetime.utcnow(),
                update_time=datetime.utcnow(),
            )
            session.add(new_item)
            inserted_count += 1
            
            # 每50条提交一次
            if inserted_count % 50 == 0:
                session.commit()
                print(f"  已插入 {inserted_count}/{len(new_questions)} 条记录...")
        
        session.commit()
        
        print(f"\n更新完成!")
        print(f"  物理删除: {deleted_count} 条记录")
        print(f"  新插入: {inserted_count} 条记录")


def update_question_knowledge(dry_run: bool = False):
    """
    更新题目知识点关系表
    通过 stem 匹配旧的 question 和新的 question，更新 question_id
    """
    print("\n" + "=" * 60)
    print("更新题目知识点关系表 (study_question_knowledge)")
    print("=" * 60)
    
    with Session(engine) as session:
        # 获取所有新的题目 (id 1-265)
        new_questions_stmt = select(StudyQuestion).where(
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        new_questions = session.exec(new_questions_stmt).all()
        
        print(f"找到 {len(new_questions)} 道新题目")
        
        # 创建 stem -> new_question_id 的映射
        stem_to_new_id = {q.stem: q.id for q in new_questions}
        
        # 获取所有需要更新的关系记录
        relations_stmt = select(StudyQuestionKnowledge).where(
            StudyQuestionKnowledge.deleted == False
        )
        relations = session.exec(relations_stmt).all()
        
        print(f"\n找到 {len(relations)} 条关系记录")
        
        if dry_run:
            print("\n[DRY RUN] 以下记录将被更新:")
            for rel in relations[:10]:
                old_question_id = rel.question_id
                old_question = session.get(StudyQuestion, old_question_id) if old_question_id else None
                if old_question:
                    new_id = stem_to_new_id.get(old_question.stem)
                    if new_id:
                        print(f"  ID={rel.id}: question_id {old_question_id} -> {new_id} (stem: {old_question.stem[:50]}...)")
                    else:
                        print(f"  ID={rel.id}: question_id {old_question_id} -> 未找到匹配")
                else:
                    print(f"  ID={rel.id}: question_id {old_question_id} -> 找不到旧的 question")
            if len(relations) > 10:
                print(f"  ... 还有 {len(relations) - 10} 条记录")
            return
        
        # 先保存所有需要的信息（在删除前）
        print(f"\n正在准备数据...")
        relations_to_insert = []
        failed_count = 0
        
        for rel in relations:
            old_question_id = rel.question_id
            # 通过旧的 question_id 找到旧的 question（在删除前）
            old_question = session.get(StudyQuestion, old_question_id) if old_question_id else None
            
            if not old_question:
                print(f"  ⚠️  跳过 ID={rel.id}: 找不到旧的 question (question_id={old_question_id})")
                failed_count += 1
                continue
            
            # 通过 stem 找到新的 question_id
            new_id = stem_to_new_id.get(old_question.stem)
            
            if not new_id:
                print(f"  ⚠️  跳过 ID={rel.id}: 找不到匹配的新 question (stem: {old_question.stem[:50]}...)")
                failed_count += 1
                continue
            
            # 保存需要插入的数据
            relations_to_insert.append({
                'question_id': new_id,  # 使用新的 question_id
                'knowledge_node_id': rel.knowledge_node_id,
                'weight': rel.weight,
                'creator': rel.creator,
                'dept_id': rel.dept_id,
                'create_time': rel.create_time,
                'update_time': datetime.utcnow(),
            })
        
        # 先物理删除所有相关记录
        print(f"\n正在物理删除所有相关记录...")
        deleted_count = 0
        for rel in relations:
            session.delete(rel)
            deleted_count += 1
        
        session.commit()
        print(f"  ✅ 已物理删除 {deleted_count} 条记录")
        
        # 重新插入记录，使用新的 question_id
        print(f"\n正在重新插入记录...")
        inserted_count = 0
        
        for rel_data in relations_to_insert:
            new_rel = StudyQuestionKnowledge(**rel_data)
            session.add(new_rel)
            inserted_count += 1
        
        session.commit()
        
        print(f"\n更新完成!")
        print(f"  物理删除: {deleted_count} 条记录")
        print(f"  重新插入: {inserted_count} 条记录")
        print(f"  失败: {failed_count} 条记录")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="更新学习抽象层和题目知识点关系表")
    parser.add_argument("--user-id", "-u", type=int, default=13, help="用户ID (默认: 13，注意：学习抽象层更新不再使用此参数)")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只打印不实际更新")
    parser.add_argument("--skip-learning-items", action="store_true", help="跳过学习抽象层更新")
    parser.add_argument("--skip-knowledge", action="store_true", help="跳过知识点关系更新")
    
    args = parser.parse_args()
    
    if not args.skip_learning_items:
        update_learning_items(user_id=args.user_id, dry_run=args.dry_run)
    
    if not args.skip_knowledge:
        update_question_knowledge(dry_run=args.dry_run)
    
    print("\n" + "=" * 60)
    print("所有更新完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
