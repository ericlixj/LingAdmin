#!/usr/bin/env python3
"""
使用 OpenAI API 为题目生成中文解释
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
# 计算项目根目录：从 admin/backend/app/scripts/generate_explanations.py -> 项目根目录
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

from app.core.db import engine
from app.models.studyQuestion import StudyQuestion


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


def generate_explanation(client: OpenAI, question: StudyQuestion, model: str = "gpt-4o") -> tuple[str, str]:
    """
    为单个题目生成解释
    
    返回: (explanation_raw, explanation_human)
    
    支持的模型:
    - gpt-4o: 最新最强的多模态模型（推荐）
    - gpt-4-turbo: 高性能 GPT-4 版本
    - gpt-4: 标准 GPT-4
    - gpt-4o-mini: 轻量级模型（速度快但质量较低）
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
        options_text = question.options
    
    # 解析答案
    try:
        answer = json.loads(question.answer)
        if isinstance(answer, list):
            answer_text = ", ".join(answer)
        else:
            answer_text = str(answer)
    except:
        answer_text = question.answer
    
    prompt = f"""这是一道BC省Class 4驾照考试题（商业驾照，用于出租车、救护车、校车等）。请用中文为这道题提供两种解释：

题目：{question.stem}

选项：
{options_text}

正确答案：{answer_text}

请严格按照以下JSON格式返回（必须是有效的JSON对象，不要包含```json标记或其他文本）：
{{
    "explanation_raw": "官方/专业解释：从法规、安全规范等专业角度解释为什么这个答案是正确的（100-200字）",
    "explanation_human": "通俗解释：用简单易懂的大白话解释这道题，帮助记忆（50-100字）"
}}"""

    # 根据模型调整参数
    max_tokens_map = {
        "gpt-4o": 800,
        "gpt-4-turbo": 800,
        "gpt-4": 800,
        "gpt-4o-mini": 500,
    }
    max_tokens = max_tokens_map.get(model, 800)
    
    # 高级模型使用更低的 temperature 以获得更一致的结果
    temperature_map = {
        "gpt-4o": 0.5,
        "gpt-4-turbo": 0.5,
        "gpt-4": 0.5,
        "gpt-4o-mini": 0.7,
    }
    temperature = temperature_map.get(model, 0.5)
    
    # 支持 JSON 格式的模型列表（新模型支持 response_format）
    json_format_models = {"gpt-4o", "gpt-4-turbo", "gpt-4"}
    use_json_format = model in json_format_models
    
    # 构建 API 调用参数
    api_params = {
        "model": model,
        "messages": [
            {"role": "system", "content": "你是一位专业的BC省驾照考试辅导老师，精通商业驾照相关法规和安全知识。请用中文回答，确保解释准确、专业且易懂。"},
            {"role": "user", "content": prompt}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    
    # 如果模型支持，使用 JSON 格式
    if use_json_format:
        api_params["response_format"] = {"type": "json_object"}
    
    try:
        response = client.chat.completions.create(**api_params)
        
        content = response.choices[0].message.content.strip()
        
        # 解析 JSON 响应
        # 如果使用了 response_format={"type": "json_object"}，响应应该直接是 JSON
        # 否则需要移除可能的 markdown 代码块标记
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()
        
        # 尝试解析 JSON
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            # 如果解析失败，尝试提取 JSON 对象
            import re
            json_match = re.search(r'\{[^{}]*"explanation_raw"[^{}]*"explanation_human"[^{}]*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise
        return result.get("explanation_raw", ""), result.get("explanation_human", "")
        
    except json.JSONDecodeError as e:
        print(f"    JSON解析错误: {e}")
        print(f"    原始响应: {content[:200]}...")
        return "", ""
    except Exception as e:
        print(f"    API调用错误: {e}")
        return "", ""


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="为题目生成中文解释")
    parser.add_argument("--exam-id", "-e", type=int, default=1, help="考试 ID (默认: 1)")
    parser.add_argument("--limit", "-l", type=int, help="限制处理数量")
    parser.add_argument("--model", "-m", type=str, default="gpt-4o", 
                       help="OpenAI 模型 (默认: gpt-4o). 可选: gpt-4o, gpt-4-turbo, gpt-4, gpt-4o-mini")
    parser.add_argument("--skip-existing", action="store_true", help="跳过已有解释的题目")
    parser.add_argument("--dry-run", "-n", action="store_true", help="只显示不实际更新")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("为 BC Class 4 驾照题目生成中文解释")
    print("=" * 60)
    
    # 显示 .env 加载状态
    if _env_loaded:
        print(f"✅ 已加载 .env 文件: {env_file}")
    elif env_file.exists():
        print(f"⚠️  .env 文件存在但可能未正确加载: {env_file}")
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
        # 查询题目
        stmt = select(StudyQuestion).where(
            StudyQuestion.exam_id == args.exam_id,
            StudyQuestion.deleted == False
        ).order_by(StudyQuestion.id)
        
        questions = session.exec(stmt).all()
        print(f"📂 找到 {len(questions)} 道题目 (exam_id={args.exam_id})")
        
        if args.skip_existing:
            questions = [q for q in questions if not q.explanation_raw or not q.explanation_human]
            print(f"   过滤后: {len(questions)} 道需要生成解释")
        
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
        
        print(f"\n📝 开始生成解释...\n")
        
        success = 0
        failed = 0
        
        for i, q in enumerate(questions, 1):
            print(f"[{i}/{len(questions)}] ID={q.id}: {q.stem[:40]}...", flush=True)
            
            try:
                explanation_raw, explanation_human = generate_explanation(client, q, args.model)
                
                if explanation_raw and explanation_human:
                    q.explanation_raw = explanation_raw
                    q.explanation_human = explanation_human
                    q.update_time = datetime.now(timezone.utc).replace(tzinfo=None)
                    session.add(q)
                    session.commit()
                    
                    print(f"    ✅ 成功", flush=True)
                    print(f"       题干: {q.stem}", flush=True)
                    print(f"       官方: {explanation_raw}", flush=True)
                    print(f"       通俗: {explanation_human}", flush=True)
                    success += 1
                else:
                    print(f"    ⚠️ 生成为空", flush=True)
                    failed += 1
                
                # 避免 API 限速
                time.sleep(0.5)
                
            except Exception as e:
                print(f"    ❌ 错误: {e}", flush=True)
                failed += 1
        
        print(f"\n" + "=" * 60)
        print(f"✅ 完成! 成功: {success}, 失败: {failed}")
        print("=" * 60)


if __name__ == "__main__":
    main()
