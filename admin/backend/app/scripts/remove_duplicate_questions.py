#!/usr/bin/env python3
"""
禁用完全重复的题目（使用 status 字段控制）

对于完全重复的题目（题干+选项+答案都相同），保留每组中 ID 最小的，其他设置为 status=0（禁用）
"""

import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion


def remove_duplicate_questions(exam_id: int = None, dry_run: bool = False):
    """
    逻辑删除完全重复的题目
    
    对于完全重复的题目（stem + options + answer 都相同），
    保留每组中 ID 最小的，其他设置为 deleted=True
    """
    print("=" * 60)
    print("逻辑删除完全重复的题目")
    print("=" * 60)
    
    with Session(engine) as session:
        # 构建查询
        stmt = select(StudyQuestion).where(
            StudyQuestion.deleted == False
        )
        
        if exam_id:
            stmt = stmt.where(StudyQuestion.exam_id == exam_id)
            print(f"筛选条件: exam_id = {exam_id}")
        else:
            print("筛选条件: 所有 exam_id")
        
        questions = session.exec(stmt.order_by(StudyQuestion.id)).all()
        print(f"\n找到 {len(questions)} 道启用状态的题目（status=1）")
        
        if not questions:
            print("没有找到题目")
            return
        
        # 按 (stem, options, answer) 分组
        signature_to_questions = defaultdict(list)
        
        for q in questions:
            stem = q.stem.strip() if q.stem else ""
            options = q.options.strip() if q.options else ""
            answer = q.answer.strip() if q.answer else ""
            
            # 创建唯一签名：stem + options + answer
            signature = (stem, options, answer)
            signature_to_questions[signature].append(q)
        
        # 找出重复的题目组
        duplicate_groups = {
            sig: q_list for sig, q_list in signature_to_questions.items() 
            if len(q_list) > 1
        }
        
        print(f"\n找到 {len(duplicate_groups)} 组完全重复的题目")
        
        if not duplicate_groups:
            print("✅ 没有发现重复题目")
            return
        
        # 统计需要删除的题目
        to_delete = []
        to_keep = []
        
        for signature, q_list in duplicate_groups.items():
            # 按 ID 排序，保留最小的
            q_list_sorted = sorted(q_list, key=lambda q: q.id)
            keep_question = q_list_sorted[0]
            delete_questions = q_list_sorted[1:]
            
            to_keep.append(keep_question)
            to_delete.extend(delete_questions)
        
        print(f"\n将保留 {len(to_keep)} 道题目（每组重复中 ID 最小的）")
        print(f"将逻辑删除 {len(to_delete)} 道重复题目")
        
        if dry_run:
            print("\n[DRY RUN] 以下题目将被逻辑删除（前20道）:")
            for i, q in enumerate(to_delete[:20], 1):
                stem_preview = q.stem[:50] + '...' if len(q.stem) > 50 else q.stem
                print(f"  {i}. ID={q.id}, exam_id={q.exam_id}: {stem_preview}")
            if len(to_delete) > 20:
                print(f"  ... 还有 {len(to_delete) - 20} 道")
            return
        
        # 执行逻辑删除
        print(f"\n正在逻辑删除 {len(to_delete)} 道重复题目...")
        deleted_count = 0
        
        for q in to_delete:
            q.deleted = True
            q.update_time = datetime.now(timezone.utc).replace(tzinfo=None)
            session.add(q)
            deleted_count += 1
            
            # 每50条提交一次
            if deleted_count % 50 == 0:
                session.commit()
                print(f"  已处理 {deleted_count}/{len(to_delete)} 道...")
        
        session.commit()
        
        print(f"\n✅ 完成!")
        print(f"  逻辑删除: {deleted_count} 道重复题目")
        print(f"  保留: {len(to_keep)} 道题目（每组重复中 ID 最小的）")
        
        # 显示一些统计信息
        print(f"\n重复题目组统计:")
        for signature, q_list in list(duplicate_groups.items())[:10]:
            stem, options, answer = signature
            keep_id = min(q.id for q in q_list)
            delete_ids = [q.id for q in q_list if q.id != keep_id]
            print(f"  保留 ID={keep_id}, 删除 IDs={delete_ids}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="禁用完全重复的题目（使用 status 字段）")
    parser.add_argument("--exam-id", "-e", type=int, help="筛选特定 exam_id 的题目")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只打印不实际更新")
    
    args = parser.parse_args()
    
    remove_duplicate_questions(exam_id=args.exam_id, dry_run=args.dry_run)
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
