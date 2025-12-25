#!/usr/bin/env python3
"""
为 study_question 表添加 image_url 列
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from sqlmodel import Session, text
from app.core.db import engine

def main():
    print("=" * 60)
    print("为 study_question 表添加 image_url 列")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # 检查列是否已存在
            check_result = session.exec(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'study_question' AND column_name = 'image_url'
            """))
            
            if check_result.first():
                print("✅ image_url 列已存在，跳过")
                return
            
            # 添加列
            session.exec(text("""
                ALTER TABLE study_question 
                ADD COLUMN image_url VARCHAR(500)
            """))
            session.commit()
            print("✅ 成功添加 image_url 列")
        except Exception as e:
            print(f"❌ 错误: {e}")
            session.rollback()
            raise

if __name__ == "__main__":
    main()


