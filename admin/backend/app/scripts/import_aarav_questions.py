#!/usr/bin/env python3
"""
导入 Aarav Driving School 爬取的 Class 4 练习题到 study_question 表
"""

import json
import sys
from pathlib import Path
from datetime import datetime

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyExam import StudyExam


def get_exam(session: Session, exam_id: int = 1) -> int:
    """获取指定ID的考试记录，返回 exam_id"""
    stmt = select(StudyExam).where(
        StudyExam.id == exam_id,
        StudyExam.deleted == False
    )
    exam = session.exec(stmt).first()
    
    if exam:
        print(f"使用考试: {exam.name} (ID: {exam.id})")
        return exam.id
    else:
        raise ValueError(f"考试 ID={exam_id} 不存在或已被删除")


def import_questions(json_file: str, exam_id: int = None, dry_run: bool = False):
    """
    导入题目到数据库
    
    参数:
        json_file: JSON 文件路径
        exam_id: 考试 ID，如果不提供则自动创建
        dry_run: 如果为 True，只打印不实际导入
    """
    # 读取 JSON 文件
    with open(json_file, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    print(f"从 {json_file} 读取了 {len(questions)} 道题目")
    
    if dry_run:
        print("\n[DRY RUN] 以下题目将被导入:")
        for i, q in enumerate(questions[:5], 1):
            print(f"  {i}. {q['stem'][:60]}...")
            print(f"     选项: {q['options']}")
            print(f"     答案: {q['answer']}")
        if len(questions) > 5:
            print(f"  ... 还有 {len(questions) - 5} 道题目")
        return
    
    with Session(engine) as session:
        # 获取考试（默认使用 ID=1）
        if exam_id is None:
            exam_id = get_exam(session, exam_id=1)
        else:
            # 验证指定的 exam_id 是否存在
            exam_id = get_exam(session, exam_id=exam_id)
        
        # 导入前先逻辑删除该 exam_id 的所有现有记录
        print(f"\n正在逻辑删除 exam_id={exam_id} 的所有现有记录...")
        delete_stmt = select(StudyQuestion).where(
            StudyQuestion.exam_id == exam_id,
            StudyQuestion.deleted == False
        )
        existing_questions = session.exec(delete_stmt).all()
        deleted_count = len(existing_questions)
        
        for q in existing_questions:
            q.deleted = True
            q.updater = "aarav_scraper"
            q.update_time = datetime.utcnow()
        
        if deleted_count > 0:
            session.commit()
            print(f"  ✅ 已逻辑删除 {deleted_count} 道现有题目")
        else:
            print(f"  ✅ 没有需要删除的现有题目")
        
        # 全量导入，不做跳过检查
        imported = 0
        
        print(f"\n开始全量导入 {len(questions)} 道题目...")
        
        for idx, q in enumerate(questions, 1):
            # 直接创建新题目，不做检查
            new_question = StudyQuestion(
                exam_id=exam_id,
                type="single",  # 单选题
                stem=q["stem"],  # 题干文本，不包含图片URL
                options=json.dumps(q["options"], ensure_ascii=False),
                answer=json.dumps([q["answer"]], ensure_ascii=False) if q["answer"] else "[]",
                explanation_raw="",
                explanation_human="",
                image_url=q.get("image_url"),  # 单独存储图片URL
                status=1,  # 启用
                creator="aarav_scraper",
                create_time=datetime.utcnow(),
                update_time=datetime.utcnow(),
            )
            session.add(new_question)
            imported += 1
            
            # 每50条提交一次，避免事务过大
            if imported % 50 == 0:
                session.commit()
                print(f"  已导入 {imported}/{len(questions)} 道题目...")
        
        session.commit()
        
        print(f"\n导入完成!")
        print(f"  新导入: {imported} 道题目")
        print(f"  逻辑删除: {deleted_count} 道旧题目")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="导入 Aarav Class 4 练习题到数据库")
    parser.add_argument("--file", "-f", type=str, 
                        default=str(Path(__file__).parent.parent.parent.parent.parent / "aarav_c4_questions.json"),
                        help="JSON 文件路径")
    parser.add_argument("--exam-id", "-e", type=int, help="考试 ID")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只打印不实际导入")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("导入 Aarav Driving School Class 4 练习题")
    print("=" * 60)
    
    if not Path(args.file).exists():
        print(f"错误: 文件不存在 {args.file}")
        print("请先运行爬虫: python -m app.scripts.scrape_aarav_questions")
        sys.exit(1)
    
    import_questions(args.file, args.exam_id, args.dry_run)


if __name__ == "__main__":
    main()


