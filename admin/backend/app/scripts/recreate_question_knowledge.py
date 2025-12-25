#!/usr/bin/env python3
"""
重新创建 question 与知识点的关联关系

由于旧的 question 已被删除，使用自动关键词匹配重新建立关联
"""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge


def recreate_question_knowledge(exam_id: int = 1, dry_run: bool = False):
    """
    重新创建 question 与知识点的关联关系
    
    由于旧的 question 已被删除，使用自动关键词匹配重新建立关联
    """
    print("=" * 60)
    print("重新创建题目知识点关联关系")
    print("=" * 60)
    
    with Session(engine) as session:
        # 获取所有新的题目 (id 1-265)
        new_questions_stmt = select(StudyQuestion).where(
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        new_questions = session.exec(new_questions_stmt).all()
        
        print(f"找到 {len(new_questions)} 道新题目 (ID: {new_questions[0].id if new_questions else 'N/A'} - {new_questions[-1].id if new_questions else 'N/A'})")
        
        # 获取所有现有的关联记录
        all_relations_stmt = select(StudyQuestionKnowledge)
        all_relations = session.exec(all_relations_stmt).all()
        
        print(f"\n找到 {len(all_relations)} 条现有的关联记录（包括已删除的）")
        
        if dry_run:
            print("\n[DRY RUN] 将执行以下操作:")
            print(f"  1. 物理删除所有现有的关联记录 ({len(all_relations)} 条)")
            print(f"  2. 使用自动关键词匹配重新建立关联")
            print(f"\n提示: 删除后将调用 link_question_knowledge.py 进行自动匹配")
            return
        
        # 先物理删除所有现有的关联记录
        print(f"\n正在物理删除所有现有的关联记录...")
        deleted_count = 0
        for rel in all_relations:
            session.delete(rel)
            deleted_count += 1
        
        session.commit()
        print(f"  ✅ 已物理删除 {deleted_count} 条记录")
        
        # 使用自动关键词匹配重新建立关联
        print(f"\n使用自动关键词匹配重新建立关联...")
        try:
            # 导入自动关联脚本
            from app.scripts.link_question_knowledge import link_questions_to_knowledge
            
            print(f"开始自动关联 (exam_id={exam_id}, threshold=0.15)...")
            link_questions_to_knowledge(exam_id=exam_id, dry_run=False, threshold=0.15)
            print(f"\n✅ 自动关联完成!")
        except ImportError as e:
            print(f"  ⚠️  无法导入自动关联脚本: {e}")
            print(f"  请手动运行: python app/scripts/link_question_knowledge.py --exam-id {exam_id}")
        except Exception as e:
            print(f"  ⚠️  自动关联失败: {e}")
            import traceback
            traceback.print_exc()
            print(f"\n请手动运行: python app/scripts/link_question_knowledge.py --exam-id {exam_id}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="重新创建题目知识点关联关系")
    parser.add_argument("--exam-id", "-e", type=int, default=1, help="考试ID (默认: 1)")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只打印不实际更新")
    
    args = parser.parse_args()
    
    recreate_question_knowledge(exam_id=args.exam_id, dry_run=args.dry_run)
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()


