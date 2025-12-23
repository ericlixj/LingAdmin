#!/usr/bin/env python3
"""
使用 AI 智能匹配重新创建题目与知识点的关联关系

先删除所有现有关联，然后使用 OpenAI API 重新建立关联
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

# 加载 .env 文件（从项目根目录）
# 计算项目根目录：从 admin/backend/app/scripts/recreate_question_knowledge_ai.py -> 项目根目录
project_root = Path(__file__).parent.parent.parent.parent.parent
env_file = project_root / ".env"

# 尝试使用 python-dotenv
_env_loaded = False
try:
    from dotenv import load_dotenv
    if env_file.exists():
        load_dotenv(env_file, override=False)  # override=False 表示不覆盖已存在的环境变量
        _env_loaded = True
except ImportError:
    # 如果没有安装 python-dotenv，手动读取 .env 文件
    if env_file.exists():
        try:
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    # 跳过空行和注释
                    if not line or line.startswith('#'):
                        continue
                    # 解析 KEY=VALUE 格式
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        # 移除引号
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        # 只在环境变量不存在时设置
                        if key and key not in os.environ:
                            os.environ[key] = value
            _env_loaded = True
        except Exception as e:
            pass  # 静默失败，在 main 中会检查环境变量
except Exception:
    pass  # 静默失败，在 main 中会检查环境变量

from sqlmodel import Session, select
from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
from app.models.studyKnowledgeNode import StudyKnowledgeNode

# 导入 AI 匹配函数
from app.scripts.link_questions_knowledge import get_openai_client, build_knowledge_list, match_knowledge


def recreate_question_knowledge_ai(
    question_exam_id: int = 1,
    knowledge_exam_id: int = 1,
    model: str = "gpt-4o",
    dry_run: bool = False
):
    """
    使用 AI 重新创建 question 与知识点的关联关系
    
    1. 删除所有现有关联
    2. 使用 AI 为每道题目重新匹配知识点
    """
    print("=" * 60)
    print("使用 AI 重新创建题目知识点关联关系")
    print("=" * 60)
    
    # 显示 .env 加载状态
    if _env_loaded:
        print(f"✅ 已加载 .env 文件: {env_file}")
    elif env_file.exists():
        print(f"⚠️  .env 文件存在但可能未正确加载: {env_file}")
    else:
        print(f"⚠️  未找到 .env 文件: {env_file}")
    
    print(f"题目 exam_id: {question_exam_id}")
    print(f"知识点 exam_id: {knowledge_exam_id}")
    print(f"AI 模型: {model}")
    print()
    
    # 获取 OpenAI 客户端
    try:
        client = get_openai_client()
        print(f"✅ OpenAI 客户端初始化成功")
        if os.environ.get("OPENAI_BASE_URL"):
            print(f"   API Base URL: {os.environ.get('OPENAI_BASE_URL')}")
    except ValueError as e:
        print(f"❌ 错误: {e}")
        print(f"   提示: 请确保在 .env 文件中设置了 OPENAI_API_KEY")
        print(f"   .env 文件路径: {env_file}")
        return
    
    with Session(engine) as session:
        # 1. 获取所有题目
        questions_stmt = select(StudyQuestion).where(
            StudyQuestion.exam_id == question_exam_id,
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        questions = session.exec(questions_stmt).all()
        print(f"📂 找到 {len(questions)} 道题目 (exam_id={question_exam_id})")
        
        if not questions:
            print("❌ 没有找到题目，退出")
            return
        
        # 2. 获取所有知识点
        knowledge_stmt = select(StudyKnowledgeNode).where(
            StudyKnowledgeNode.exam_id == knowledge_exam_id,
            StudyKnowledgeNode.deleted == False
        ).order_by(StudyKnowledgeNode.id)
        knowledge_nodes = session.exec(knowledge_stmt).all()
        print(f"📚 找到 {len(knowledge_nodes)} 个知识点 (exam_id={knowledge_exam_id})")
        
        if not knowledge_nodes:
            print("❌ 没有找到知识点，退出")
            return
        
        # 3. 构建知识点列表文本
        knowledge_list = build_knowledge_list(knowledge_nodes)
        knowledge_ids = {n.id for n in knowledge_nodes}
        
        # 4. 获取所有现有的关联记录
        all_relations_stmt = select(StudyQuestionKnowledge)
        all_relations = session.exec(all_relations_stmt).all()
        print(f"\n找到 {len(all_relations)} 条现有的关联记录（包括已删除的）")
        
        if dry_run:
            print("\n[DRY RUN] 将执行以下操作:")
            print(f"  1. 物理删除所有现有的关联记录 ({len(all_relations)} 条)")
            print(f"  2. 使用 AI ({model}) 为 {len(questions)} 道题目重新匹配知识点")
            print(f"\n前5道题目预览:")
            for i, q in enumerate(questions[:5], 1):
                print(f"  {i}. ID={q.id}: {q.stem[:50]}...")
            if len(questions) > 5:
                print(f"  ... 还有 {len(questions) - 5} 道")
            return
        
        # 5. 物理删除所有现有的关联记录
        print(f"\n正在物理删除所有现有的关联记录...")
        deleted_count = 0
        for rel in all_relations:
            session.delete(rel)
            deleted_count += 1
        
        session.commit()
        print(f"  ✅ 已物理删除 {deleted_count} 条记录")
        
        # 6. 使用 AI 重新建立关联
        print(f"\n🔗 开始使用 AI 重新建立关联...\n")
        
        success = 0
        failed = 0
        total_links = 0
        
        for i, q in enumerate(questions, 1):
            print(f"[{i}/{len(questions)}] ID={q.id}: {q.stem[:40]}...", flush=True)
            
            try:
                # 使用 AI 匹配知识点
                matches = match_knowledge(client, q, knowledge_list, model)
                
                if matches:
                    for match in matches:
                        # 验证知识点ID存在
                        if match["knowledge_node_id"] not in knowledge_ids:
                            print(f"    ⚠️ 无效知识点ID: {match['knowledge_node_id']}", flush=True)
                            continue
                        
                        # 创建关联
                        link = StudyQuestionKnowledge(
                            question_id=q.id,
                            knowledge_node_id=match["knowledge_node_id"],
                            weight=match["weight"],
                            creator="ai_recreate",
                            create_time=datetime.now(timezone.utc).replace(tzinfo=None),
                            update_time=datetime.now(timezone.utc).replace(tzinfo=None),
                        )
                        session.add(link)
                        total_links += 1
                    
                    session.commit()
                    print(f"    ✅ 关联 {len(matches)} 个知识点", flush=True)
                    success += 1
                else:
                    print(f"    ⚠️ 未匹配到知识点", flush=True)
                    failed += 1
                
                # 避免 API 限速
                import time
                time.sleep(0.5)
                
            except Exception as e:
                print(f"    ❌ 错误: {e}", flush=True)
                failed += 1
        
        print(f"\n" + "=" * 60)
        print(f"✅ 完成!")
        print(f"  物理删除: {deleted_count} 条记录")
        print(f"  成功处理: {success} 道题目")
        print(f"  失败: {failed} 道题目")
        print(f"  新建关联: {total_links} 条")
        print("=" * 60)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="使用 AI 重新创建题目知识点关联关系")
    parser.add_argument("--question-exam-id", "-q", type=int, default=1, help="题目考试ID (默认: 1)")
    parser.add_argument("--knowledge-exam-id", "-k", type=int, default=1, help="知识点考试ID (默认: 1)")
    parser.add_argument("--model", "-m", type=str, default="gpt-4o", 
                       help="OpenAI 模型 (默认: gpt-4o). 可选: gpt-4o, gpt-4-turbo, gpt-4, gpt-4o-mini")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只打印不实际更新")
    
    args = parser.parse_args()
    
    recreate_question_knowledge_ai(
        question_exam_id=args.question_exam_id,
        knowledge_exam_id=args.knowledge_exam_id,
        model=args.model,
        dry_run=args.dry_run
    )
    
    print("\n" + "=" * 60)
    print("完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
