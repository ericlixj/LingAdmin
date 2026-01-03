"""
基于知识点（items）生成问题（questions）的脚本
为每个知识点创建一个问题，并建立question与knowledgeNode的关联
"""
import sys
import json
import logging
import random
import os
import time
from pathlib import Path

# 首先加载 .env 文件（在其他导入之前）
# 脚本位置: admin/backend/app/scripts/generate_questions_from_items.py
# 项目根目录: LingAdmin/ 
try:
    # 如果 __file__ 可用，从脚本路径计算
    script_file = Path(__file__)
    # 从 admin/backend/app/scripts/xxx.py 向上4级到项目根目录
    project_root = script_file.parent.parent.parent.parent
except NameError:
    # 如果 __file__ 不可用（如交互式环境），使用当前工作目录向上查找
    current = Path.cwd()
    # 从 admin/backend 向上2级到项目根目录
    if 'admin/backend' in str(current) or current.name == 'backend':
        project_root = current.parent.parent
    else:
        # 尝试向上查找包含 .env 的目录
        project_root = current
        for _ in range(5):
            if (project_root / '.env').exists():
                break
            project_root = project_root.parent

env_file = project_root / ".env"

# 加载 .env 文件
try:
    from dotenv import load_dotenv
    if env_file.exists():
        load_dotenv(env_file, override=False)
    else:
        # 如果找不到，尝试在项目根目录查找
        alt_env_file = project_root.parent / ".env"
        if alt_env_file.exists():
            load_dotenv(alt_env_file, override=False)
            env_file = alt_env_file
except ImportError:
    # 如果没有 dotenv，手动加载
    for env_path in [env_file, project_root.parent / ".env"]:
        if env_path.exists():
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            key, value = line.split('=', 1)
                            key = key.strip()
                            value = value.strip()
                            if value.startswith('"') and value.endswith('"'):
                                value = value[1:-1]
                            elif value.startswith("'") and value.endswith("'"):
                                value = value[1:-1]
                            if key and key not in os.environ:
                                os.environ[key] = value
                env_file = env_path
                break
            except Exception:
                pass

from app.core.db import engine
from app.models.studyKnowledgeNode import StudyKnowledgeNode
from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
from app.models.studyQuestion import StudyQuestion, StudyQuestionCreate, StudyQuestionUpdate
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge, StudyQuestionKnowledgeCreate
from app.crud.studyQuestion_crud import StudyQuestionCRUD
from app.crud.studyQuestionKnowledge_crud import StudyQuestionKnowledgeCRUD
from sqlmodel import Session, select

from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

EXAM_ID = 6
SOURCE_SECTION_ID = 730

# 选项标签
OPTION_LABELS = ['A', 'B', 'C', 'D']


# 尝试导入 OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI 库未安装，将跳过翻译功能")


def get_openai_client():
    """获取 OpenAI 客户端"""
    if not OPENAI_AVAILABLE:
        raise ValueError("OpenAI 库未安装")
    
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")
    
    if not api_key:
        raise ValueError("请设置环境变量 OPENAI_API_KEY")
    
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    
    return OpenAI(**kwargs)


def translate_explanation(client: OpenAI, english_text: str, model: str = "gpt-4o-mini") -> str:
    """
    使用 OpenAI API 将英文解释翻译成中文
    
    Args:
        client: OpenAI 客户端
        english_text: 英文文本
        model: 使用的模型（默认 gpt-4o-mini，速度快且便宜）
    
    Returns:
        中文翻译文本
    """
    if not english_text or not english_text.strip():
        return ""
    
    prompt = f"""请将以下英文文本翻译成简体中文。要求：
1. 翻译准确、流畅
2. 保持原文的格式和结构
3. 如果是游戏相关术语，请使用常见的中文翻译

英文文本：
{english_text}

请直接返回中文翻译，不要添加任何解释或标记。"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是一位专业的翻译助手，擅长将英文翻译成准确流畅的中文。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
        )
        
        translated = response.choices[0].message.content.strip()
        return translated
        
    except Exception as e:
        logger.error(f"翻译失败: {e}")
        return ""


def generate_question_for_item(item: StudyKnowledgeNode, all_items: list[StudyKnowledgeNode]) -> StudyQuestionCreate:
    """
    为每个item生成一个问题
    问题类型：选择题
    题干：关于该item的描述（英文）
    选项：4个选项，其中一个是正确答案（item的描述），其他3个从其他item的描述中随机选择
    答案位置：随机选择（A/B/C/D）
    """
    # 生成题干（英文）
    stem = f"Which of the following correctly describes {item.title}?"
    
    # 从其他item中随机选择3个作为干扰项（排除当前item）
    other_items = [i for i in all_items if i.id != item.id]
    if len(other_items) < 3:
        # 如果其他item不足3个，使用默认干扰项描述
        distractors = [
            "An unknown item with no specific description",
            "A decorative item in the game with no practical use",
            "An unobtainable item that cannot be acquired"
        ]
    else:
        # 随机选择3个其他item的描述作为干扰项
        selected_distractors = random.sample(other_items, 3)
        distractors = []
        for d in selected_distractors:
            # 使用其他item的描述，如果没有描述则使用默认文本
            desc = d.description or f"An item with no specific description"
            # 从描述中去除 item 名称（如果描述以名称开头）
            if desc.startswith(d.title):
                # 去除开头的名称和可能的标点符号
                desc = desc[len(d.title):].strip()
                # 去除开头的标点符号（如冒号、句号等）
                if desc and desc[0] in [':', '.', ' ', '-', '—']:
                    desc = desc[1:].strip()
            # 截取描述的前200个字符，避免选项过长
            distractors.append(desc[:200] if len(desc) > 200 else desc)
    
    # 随机选择正确答案的位置（A/B/C/D）
    correct_position = random.choice(OPTION_LABELS)
    correct_index = OPTION_LABELS.index(correct_position)
    
    # 构建所有选项值（正确答案的描述 + 3个干扰项的描述）
    # 当前item的描述作为正确答案，但要去除名称
    correct_description = item.description or f"An item with no specific description"
    # 从描述中去除 item 名称（如果描述以名称开头）
    if correct_description.startswith(item.title):
        # 去除开头的名称和可能的标点符号
        correct_description = correct_description[len(item.title):].strip()
        # 去除开头的标点符号（如冒号、句号等）
        if correct_description and correct_description[0] in [':', '.', ' ', '-', '—']:
            correct_description = correct_description[1:].strip()
    # 如果描述中没有名称，直接使用
    # 截取描述的前200个字符，避免选项过长
    correct_description = correct_description[:200] if len(correct_description) > 200 else correct_description
    all_option_values = [correct_description] + distractors
    
    # 随机打乱所有选项值
    random.shuffle(all_option_values)
    
    # 确保正确答案在指定位置
    # 如果正确答案不在指定位置，交换它们
    current_correct_index = all_option_values.index(correct_description)
    if current_correct_index != correct_index:
        all_option_values[current_correct_index], all_option_values[correct_index] = \
            all_option_values[correct_index], all_option_values[current_correct_index]
    
    # 构建选项字典
    options = {}
    for i, label in enumerate(OPTION_LABELS):
        options[label] = all_option_values[i]
    
    # 生成答案（英文）
    description = item.description or ""
    answer = {
        "correct": [correct_position],
        "explanation": f"{item.title}: {description[:200] if description else 'No description available'}"
    }
    
    # 生成解释（英文）- 保留名称
    # explanation_raw 应该包含名称和描述
    if description:
        explanation_raw = f"{item.title}: {description}"
    else:
        explanation_raw = f"{item.title}: No description available"
    # 限制长度
    explanation_raw = explanation_raw[:9999] if len(explanation_raw) > 9999 else explanation_raw
    explanation_human = ""  # 将在后续通过翻译生成
    
    return StudyQuestionCreate(
        exam_id=EXAM_ID,
        type="single_choice",  # 单选题
        stem=stem,
        options=json.dumps(options, ensure_ascii=False),
        answer=json.dumps(answer, ensure_ascii=False),
        explanation_raw=explanation_raw,
        explanation_human=explanation_human,  # 将在后续通过翻译填充
        image_url=item.image_url or None,
        status=1,  # 1表示启用
        creator="system",
        dept_id=1
    )


def main(user_id: int = 1, dept_id: int = 1, regenerate: bool = False, use_translation: bool = True, model: str = "gpt-4o-mini"):
    """
    主函数：为所有item生成问题
    
    Args:
        user_id: 用户ID
        dept_id: 部门ID
        regenerate: 是否重新生成（删除旧问题并重新创建）
    """
    logger.info(f"开始为exam_id={EXAM_ID}的知识点生成问题...")
    if regenerate:
        logger.info("模式: 重新生成（将删除旧问题）")
    else:
        logger.info("模式: 仅创建新问题（跳过已存在的问题）")
    
    # 初始化 OpenAI 客户端（如果需要翻译）
    client = None
    if use_translation:
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI 库未安装，将跳过翻译功能")
            use_translation = False
        else:
            try:
                client = get_openai_client()
                logger.info(f"✅ OpenAI 客户端初始化成功，使用模型: {model}")
                if os.environ.get("OPENAI_BASE_URL"):
                    logger.info(f"   API Base URL: {os.environ.get('OPENAI_BASE_URL')}")
            except ValueError as e:
                logger.warning(f"⚠️  OpenAI 客户端初始化失败: {e}，将跳过翻译功能")
                logger.info(f"   提示: 请确保 .env 文件中设置了 OPENAI_API_KEY")
                logger.info(f"   .env 文件路径: {env_file}")
                logger.info(f"   .env 文件存在: {env_file.exists()}")
                use_translation = False
    
    with Session(engine) as session:
        # 查询所有关联到 source_section_id=730 且 exam_id=6 的知识点
        items = session.exec(
            select(StudyKnowledgeNode)
            .join(StudyKnowledgeSourceSection, StudyKnowledgeNode.id == StudyKnowledgeSourceSection.knowledge_node_id)
            .where(
                StudyKnowledgeSourceSection.source_section_id == SOURCE_SECTION_ID,
                StudyKnowledgeNode.deleted == False,
                StudyKnowledgeSourceSection.deleted == False,
                StudyKnowledgeNode.exam_id == EXAM_ID
            )
            .order_by(StudyKnowledgeNode.id)
        ).all()
        
        logger.info(f"找到 {len(items)} 个知识点")
        
        question_crud = StudyQuestionCRUD(session, user_id=user_id, dept_id=dept_id)
        question_knowledge_crud = StudyQuestionKnowledgeCRUD(session, user_id=user_id, dept_id=dept_id)
        
        # 如果重新生成，先删除所有旧问题
        if regenerate:
            logger.info("正在删除旧问题...")
            deleted_count = 0
            for item in items:
                existing_question = session.exec(
                    select(StudyQuestion)
                    .join(StudyQuestionKnowledge, StudyQuestion.id == StudyQuestionKnowledge.question_id)
                    .where(
                        StudyQuestionKnowledge.knowledge_node_id == item.id,
                        StudyQuestion.exam_id == EXAM_ID,
                        StudyQuestion.deleted == False,
                        StudyQuestionKnowledge.deleted == False
                    )
                ).first()
                
                if existing_question:
                    # 软删除问题和关联
                    question_crud.soft_delete(existing_question)
                    # 删除关联
                    existing_links = session.exec(
                        select(StudyQuestionKnowledge)
                        .where(
                            StudyQuestionKnowledge.question_id == existing_question.id,
                            StudyQuestionKnowledge.deleted == False
                        )
                    ).all()
                    for link in existing_links:
                        question_knowledge_crud.soft_delete(link)
                    deleted_count += 1
            logger.info(f"已删除 {deleted_count} 个旧问题")
        
        created_count = 0
        skipped_count = 0
        
        # 将items转换为列表，以便传递给生成函数
        items_list = list(items)
        
        for item in items_list:
            try:
                # 检查是否已经为该知识点创建了问题
                existing_question = session.exec(
                    select(StudyQuestion)
                    .join(StudyQuestionKnowledge, StudyQuestion.id == StudyQuestionKnowledge.question_id)
                    .where(
                        StudyQuestionKnowledge.knowledge_node_id == item.id,
                        StudyQuestion.exam_id == EXAM_ID,
                        StudyQuestion.deleted == False,
                        StudyQuestionKnowledge.deleted == False
                    )
                ).first()
                
                if existing_question and not regenerate:
                    logger.info(f"知识点 {item.title} (id: {item.id}) 已存在问题，跳过")
                    skipped_count += 1
                    continue
                
                # 生成问题（传入所有items用于生成干扰项）
                question_in = generate_question_for_item(item, items_list)
                question_obj = question_crud.create(question_in)
                
                # 如果需要翻译，将英文解释翻译成中文
                if use_translation and client and question_obj.explanation_raw:
                    try:
                        logger.info(f"正在翻译问题 {question_obj.id} 的解释...")
                        translated = translate_explanation(client, question_obj.explanation_raw, model)
                        if translated:
                            update_in = StudyQuestionUpdate(explanation_human=translated)
                            question_obj = question_crud.update(question_obj, update_in)
                            logger.info(f"翻译完成: {translated[:50]}...")
                        else:
                            logger.warning(f"翻译结果为空，跳过")
                        # 避免 API 限速
                        time.sleep(0.3)
                    except Exception as e:
                        logger.error(f"翻译失败: {e}")
                
                # 解析答案以记录正确答案位置
                try:
                    answer_data = json.loads(question_obj.answer)
                    correct_answer = answer_data.get("correct", ["?"])[0]
                except:
                    correct_answer = "?"
                
                logger.info(f"创建问题: {question_obj.id} - {question_obj.stem[:50]}... (正确答案: {correct_answer})")
                
                # 创建问题与知识点的关联
                link_in = StudyQuestionKnowledgeCreate(
                    question_id=question_obj.id,
                    knowledge_node_id=item.id,
                    weight=100,  # 权重100（base100）
                    creator=str(user_id),
                    dept_id=dept_id
                )
                link_obj = question_knowledge_crud.create(link_in)
                logger.info(f"创建问题关联: question_id={question_obj.id} <-> knowledge_node_id={item.id} (link_id: {link_obj.id})")
                
                created_count += 1
                
            except Exception as e:
                logger.error(f"为知识点 {item.title} (id: {item.id}) 创建问题失败: {e}")
                continue
        
        logger.info(f"\n完成！")
        logger.info(f"创建问题: {created_count} 个")
        if not regenerate:
            logger.info(f"跳过（已存在）: {skipped_count} 个")
        logger.info(f"总计知识点: {len(items)} 个")


if __name__ == "__main__":
    user_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    dept_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    regenerate = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    use_translation = sys.argv[4].lower() != 'false' if len(sys.argv) > 4 else True
    model = sys.argv[5] if len(sys.argv) > 5 else "gpt-4o-mini"
    main(user_id=user_id, dept_id=dept_id, regenerate=regenerate, use_translation=use_translation, model=model)

