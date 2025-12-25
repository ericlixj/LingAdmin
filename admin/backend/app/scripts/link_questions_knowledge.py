#!/usr/bin/env python3
"""
使用 OpenAI API 自动关联题目与知识点
"""

import json
import time
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI
from sqlmodel import Session, select

# 添加项目路径
sys.path.insert(0, str(__file__).rsplit("/app/", 1)[0])

# 加载 .env 文件（从项目根目录）
# 计算项目根目录：从 admin/backend/app/scripts/link_questions_knowledge.py -> 项目根目录
project_root = Path(__file__).parent.parent.parent.parent.parent
env_file = project_root / ".env"

# 尝试使用 python-dotenv
try:
    from dotenv import load_dotenv
    if env_file.exists():
        load_dotenv(env_file, override=False)  # override=False 表示不覆盖已存在的环境变量
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
        except Exception:
            pass  # 静默失败

from app.core.db import engine
from app.models.studyQuestion import StudyQuestion
from app.models.studyKnowledgeNode import StudyKnowledgeNode
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge


def get_openai_client():
    """获取 OpenAI 客户端"""
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    
    if not api_key:
        raise ValueError("请设置环境变量 OPENAI_API_KEY")
    
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    
    return OpenAI(**kwargs)


def build_knowledge_list(nodes: list[StudyKnowledgeNode]) -> str:
    """构建知识点列表文本"""
    lines = []
    for n in nodes:
        lines.append(f"ID={n.id}: {n.title}")
    return "\n".join(lines)


def match_knowledge(client: OpenAI, question: StudyQuestion, knowledge_list: str, model: str = "gpt-4o-mini") -> list[dict]:
    """
    使用 AI 匹配题目对应的知识点
    
    返回: [{"knowledge_node_id": int, "weight": int}, ...]
    """
    # 解析选项
    try:
        options = json.loads(question.options)
        if isinstance(options, dict):
            options_text = "\n".join([f"{k}. {v}" for k, v in options.items()])
        elif isinstance(options, list):
            options_text = "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)])
        else:
            options_text = str(options)
    except:
        options_text = question.options or ""
    
    prompt = f"""请分析以下驾照考试题目，从知识点列表中选择1-3个最相关的知识点。

【题目】
{question.stem}

【选项】
{options_text}

【知识点列表】
{knowledge_list}

请返回JSON格式（不要包含```json标记）：
[
    {{"knowledge_node_id": <ID>, "weight": <权重1-100，100表示完全相关>}},
    ...
]

要求：
1. 只选择真正相关的知识点，不要勉强
2. 如果没有完全匹配的，选择最接近的1-2个
3. weight表示相关程度：80-100=高度相关，60-79=中等相关，40-59=略微相关
4. 最多返回3个知识点"""

    # 根据模型调整参数
    max_tokens_map = {
        "gpt-4o": 300,
        "gpt-4-turbo": 300,
        "gpt-4": 300,
        "gpt-4o-mini": 200,
    }
    max_tokens = max_tokens_map.get(model, 200)
    
    # 支持 JSON 格式的模型列表
    json_format_models = {"gpt-4o", "gpt-4-turbo", "gpt-4"}
    use_json_format = model in json_format_models
    
    # 根据是否使用 JSON 格式构建不同的 prompt
    if use_json_format:
        prompt_json = f"""请分析以下驾照考试题目，从知识点列表中选择1-3个最相关的知识点。

【题目】
{question.stem}

【选项】
{options_text}

【知识点列表】
{knowledge_list}

请返回JSON格式（必须是有效的JSON对象）：
{{
    "matches": [
        {{"knowledge_node_id": <ID>, "weight": <权重1-100，100表示完全相关>}},
        ...
    ]
}}

要求：
1. 只选择真正相关的知识点，不要勉强
2. 如果没有完全匹配的，选择最接近的1-2个
3. weight表示相关程度：80-100=高度相关，60-79=中等相关，40-59=略微相关
4. 最多返回3个知识点"""
        user_content = prompt_json
    else:
        user_content = prompt
    
    # 构建 API 调用参数
    api_params = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一位专业的驾照考试知识点分类专家。请用中文回答，确保分析准确。"},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.3,
        "max_tokens": max_tokens,
    }
    
    # 如果模型支持，使用 JSON 格式
    if use_json_format:
        api_params["response_format"] = {"type": "json_object"}
    
    try:
        response = client.chat.completions.create(**api_params)
        
        content = response.choices[0].message.content.strip()
        
        # 移除可能的 markdown 代码块标记
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        result = json.loads(content)
        
        # 处理不同的返回格式
        matches = []
        if isinstance(result, dict) and "matches" in result:
            # JSON 格式返回
            matches = result["matches"]
        elif isinstance(result, list):
            # 列表格式返回
            matches = result
        else:
            return []
        
        # 验证并转换格式
        valid_results = []
        for item in matches:
            if isinstance(item, dict) and "knowledge_node_id" in item:
                valid_results.append({
                    "knowledge_node_id": int(item["knowledge_node_id"]),
                    "weight": int(item.get("weight", 70))
                })
        return valid_results[:3]  # 最多3个
        
    except json.JSONDecodeError as e:
        print(f"    JSON解析错误: {e}")
        return []
    except Exception as e:
        print(f"    API调用错误: {e}")
        return []


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="自动关联题目与知识点")
    parser.add_argument("--question-exam-id", "-q", type=int, default=3, help="题目考试ID (默认: 3)")
    parser.add_argument("--knowledge-exam-id", "-k", type=int, default=1, help="知识点考试ID (默认: 1)")
    parser.add_argument("--limit", "-l", type=int, help="限制处理数量")
    parser.add_argument("--model", "-m", type=str, default="gpt-4o-mini", help="OpenAI 模型")
    parser.add_argument("--skip-existing", action="store_true", help="跳过已有关联的题目")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只显示不实际更新")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("自动关联题目与知识点")
    print("=" * 60)
    
    # 显示 .env 加载状态
    if env_file.exists():
        print(f"✅ .env 文件路径: {env_file}")
    else:
        print(f"⚠️  未找到 .env 文件: {env_file}")
    
    # 获取 OpenAI 客户端
    try:
        client = get_openai_client()
        print(f"✅ OpenAI 客户端初始化成功")
        print(f"   使用模型: {args.model}")
        if os.environ.get("OPENAI_BASE_URL"):
            print(f"   API Base URL: {os.environ.get('OPENAI_BASE_URL')}")
    except ValueError as e:
        print(f"❌ 错误: {e}")
        print(f"   提示: 请确保在 .env 文件中设置了 OPENAI_API_KEY")
        print(f"   .env 文件路径: {env_file}")
        return
    
    with Session(engine) as session:
        # 加载知识点
        stmt = select(StudyKnowledgeNode).where(
            StudyKnowledgeNode.exam_id == args.knowledge_exam_id,
            StudyKnowledgeNode.deleted == False
        ).order_by(StudyKnowledgeNode.id)
        
        knowledge_nodes = session.exec(stmt).all()
        knowledge_ids = {n.id for n in knowledge_nodes}
        print(f"📚 加载 {len(knowledge_nodes)} 个知识点 (exam_id={args.knowledge_exam_id})")
        
        if not knowledge_nodes:
            print("❌ 没有找到知识点，退出")
            return
        
        # 构建知识点列表文本
        knowledge_list = build_knowledge_list(knowledge_nodes)
        
        # 加载题目
        stmt = select(StudyQuestion).where(
            StudyQuestion.exam_id == args.question_exam_id,
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        
        questions = session.exec(stmt).all()
        print(f"📂 找到 {len(questions)} 道题目 (exam_id={args.question_exam_id})")
        
        if args.skip_existing:
            # 获取已有关联的题目ID
            stmt = select(StudyQuestionKnowledge.question_id).where(
                StudyQuestionKnowledge.deleted == False
            ).distinct()
            existing_ids = set(session.exec(stmt).all())
            questions = [q for q in questions if q.id not in existing_ids]
            print(f"   过滤后: {len(questions)} 道需要关联")
        
        if args.limit:
            questions = questions[:args.limit]
            print(f"   限制处理: {args.limit} 道")
        
        if args.dry_run:
            print("\n[DRY RUN] 以下题目将被处理:")
            for i, q in enumerate(questions[:5], 1):
                print(f"  {i}. ID={q.id}: {q.stem[:50]}...")
            if len(questions) > 5:
                print(f"  ... 还有 {len(questions) - 5} 道")
            return
        
        print(f"\n🔗 开始关联...\n")
        
        success = 0
        failed = 0
        total_links = 0
        
        for i, q in enumerate(questions, 1):
            print(f"[{i}/{len(questions)}] ID={q.id}: {q.stem[:40]}...", flush=True)
            
            try:
                matches = match_knowledge(client, q, knowledge_list, args.model)
                
                if matches:
                    for match in matches:
                        # 验证知识点ID存在
                        if match["knowledge_node_id"] not in knowledge_ids:
                            print(f"    ⚠️ 无效知识点ID: {match['knowledge_node_id']}", flush=True)
                            continue
                        
                        # 检查是否已存在
                        existing = session.exec(
                            select(StudyQuestionKnowledge).where(
                                StudyQuestionKnowledge.question_id == q.id,
                                StudyQuestionKnowledge.knowledge_node_id == match["knowledge_node_id"],
                                StudyQuestionKnowledge.deleted == False
                            )
                        ).first()
                        
                        if existing:
                            print(f"    ⏭️ 已存在关联: knowledge_id={match['knowledge_node_id']}", flush=True)
                            continue
                        
                        # 创建关联
                        link = StudyQuestionKnowledge(
                            question_id=q.id,
                            knowledge_node_id=match["knowledge_node_id"],
                            weight=match["weight"],
                            creator="ai_linker",
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
                time.sleep(0.5)
                
            except Exception as e:
                print(f"    ❌ 错误: {e}", flush=True)
                failed += 1
        
        print(f"\n" + "=" * 60)
        print(f"✅ 完成! 成功: {success}, 失败: {failed}, 新建关联: {total_links}")
        print("=" * 60)


if __name__ == "__main__":
    main()


