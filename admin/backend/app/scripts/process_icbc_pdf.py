"""
ICBC Class 4 驾照教材 PDF 处理脚本
从 PDF 中提取章节结构、知识点和题目

使用方法:
    cd admin/backend
    pip install pdfplumber  # 安装依赖
    python -m app.scripts.process_icbc_pdf --pdf /path/to/pdf --exam-id 1 --source-id 1

功能:
    1. 解析 PDF 提取文本和章节结构
    2. 创建 StudySourceSection（章节）
    3. 识别并创建 StudyKnowledgeNode（知识点）
    4. 建立 StudyKnowledgeSourceSection（知识点与章节映射）
    5. 提取练习题创建 StudyQuestion（如有）
    6. 建立 StudyQuestionKnowledge（题目与知识点关联）
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("请先安装 pdfplumber: pip install pdfplumber")
    sys.exit(1)


def extract_pdf_text(pdf_path: str) -> List[Dict]:
    """
    从 PDF 中提取文本，返回每页的内容
    """
    pages_content = []
    
    with pdfplumber.open(pdf_path) as pdf:
        logger.info(f"PDF 共 {len(pdf.pages)} 页")
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            pages_content.append({
                "page_num": i + 1,
                "text": text,
                "chars_count": len(text)
            })
            
            if (i + 1) % 50 == 0:
                logger.info(f"已处理 {i + 1} 页...")
    
    return pages_content


def detect_chapters(pages_content: List[Dict]) -> List[Dict]:
    """
    检测章节结构
    常见的章节标题模式:
    - Chapter 1: xxx
    - CHAPTER 1 xxx
    - 1. xxx
    - Section 1: xxx
    """
    chapters = []
    
    # 章节标题模式
    chapter_patterns = [
        r'^(Chapter\s+\d+)[:\s]+(.+)$',
        r'^(CHAPTER\s+\d+)[:\s]+(.+)$',
        r'^(\d+)\.\s+([A-Z][A-Za-z\s]+)$',
        r'^(Section\s+\d+)[:\s]+(.+)$',
        r'^([A-Z][A-Z\s]{5,})$',  # 全大写标题
    ]
    
    for page_data in pages_content:
        page_num = page_data["page_num"]
        text = page_data["text"]
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            for pattern in chapter_patterns:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    groups = match.groups()
                    chapter_info = {
                        "chapter": groups[0] if len(groups) > 0 else "",
                        "title": groups[1] if len(groups) > 1 else groups[0],
                        "page_start": page_num,
                        "raw_line": line
                    }
                    
                    # 避免重复
                    if not any(c["raw_line"] == line for c in chapters):
                        chapters.append(chapter_info)
                    break
    
    # 计算每个章节的结束页
    for i, chapter in enumerate(chapters):
        if i + 1 < len(chapters):
            chapter["page_end"] = chapters[i + 1]["page_start"] - 1
        else:
            chapter["page_end"] = len(pages_content)
    
    return chapters


def extract_knowledge_points(pages_content: List[Dict], chapters: List[Dict]) -> List[Dict]:
    """
    从内容中提取知识点
    知识点通常是:
    - 重要概念定义
    - 规则和法规
    - 安全提示
    - 考试重点
    """
    knowledge_points = []
    
    # 预处理：合并所有页面内容，以便提取跨行的完整句子
    for page_data in pages_content:
        # 将换行符替换为空格，以便提取完整句子
        page_data["clean_text"] = re.sub(r'\s+', ' ', page_data["text"])
    
    # 知识点关键词模式 - 匹配关键词前后的完整句子
    # 格式: (关键词模式, 重要性, 是否包含关键词在描述中)
    knowledge_patterns = [
        # 高重要性 - 法规和强制要求 (匹配完整句子)
        (r'([A-Z][^.!?]*(?:must|must\s+be|must\s+have|must\s+not)[^.!?]+[.!?])', "high"),
        (r'([A-Z][^.!?]*(?:required\s+to|required\s+by)[^.!?]+[.!?])', "high"),
        (r'([A-Z][^.!?]*(?:illegal\s+to|against\s+the\s+law)[^.!?]+[.!?])', "high"),
        (r'(Never\s+[^.!?]+[.!?])', "high"),
        (r'(Always\s+[^.!?]+[.!?])', "high"),
        
        # 中等重要性 - 建议和提示
        (r'([A-Z][^.!?]*(?:should|should\s+be|should\s+have|should\s+not)[^.!?]+[.!?])', "medium"),
        (r'(Remember[^.!?]+[.!?])', "medium"),
        (r'(Important[:\s][^.!?]+[.!?])', "medium"),
        
        # 数值和限制 - 匹配包含数字的句子
        (r'([A-Z][^.!?]*(?:maximum|minimum|at\s+least|no\s+more\s+than)\s+\d+[^.!?]+[.!?])', "high"),
        (r'([A-Z][^.!?]*speed\s+limit[^.!?]+[.!?])', "high"),
        (r'([A-Z][^.!?]*\d+\s*(?:km/h|metres?|meters?|feet|hours?|minutes?|seconds?)[^.!?]+[.!?])', "medium"),
        
        # 定义类
        (r'([A-Z][^.!?]*(?:means|refers\s+to|is\s+defined\s+as|is\s+called)[^.!?]+[.!?])', "medium"),
        
        # 警告和危险
        (r'(Warning[:\s][^.!?]+[.!?])', "high"),
        (r'([A-Z][^.!?]*(?:dangerous|hazardous|risk)[^.!?]+[.!?])', "medium"),
    ]
    
    for page_data in pages_content:
        page_num = page_data["page_num"]
        text = page_data.get("clean_text", page_data["text"])
        
        # 跳过目录页（前17页通常是目录和介绍）
        if page_num < 18:
            continue
        
        # 找到对应的章节
        current_chapter = None
        for chapter in chapters:
            if chapter["page_start"] <= page_num <= chapter.get("page_end", page_num):
                current_chapter = chapter
                break
        
        for pattern, importance in knowledge_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # 清理匹配内容
                full_text = match.strip()
                
                # 过滤条件
                if len(full_text) < 30:  # 太短的跳过
                    continue
                if '...' in full_text:  # 跳过目录行
                    continue
                if full_text.count('.') > 3:  # 可能是多个句子拼接，跳过
                    continue
                if re.match(r'^Chapter\s+\d+', full_text):  # 章节标题
                    continue
                    
                # 生成标题：提取关键短语（最多255字符）
                title = full_text
                # 如果句子太长，在合适的位置截断
                if len(title) > 255:
                    # 优先在逗号处截断
                    if ',' in title[:255]:
                        title = title[:title.rindex(',', 0, 255)]
                    else:
                        title = title[:252] + "..."
                title = title.strip()
                
                # 描述：完整的句子
                description = full_text
                
                kp = {
                    "title": title,
                    "description": description,
                    "page": page_num,
                    "chapter": current_chapter["chapter"] if current_chapter else "",
                    "importance": importance
                }
                
                # 避免重复（检查描述相似度）
                is_duplicate = False
                for existing in knowledge_points:
                    if existing["description"] == description:
                        is_duplicate = True
                        break
                    # 如果标题相同且在同一页，也算重复
                    if existing["title"] == title and existing["page"] == page_num:
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    knowledge_points.append(kp)
    
    return knowledge_points


def extract_questions(pages_content: List[Dict]) -> List[Dict]:
    """
    从 PDF 中提取练习题
    题目通常的格式:
    - 1. Question text?
       a) Option A
       b) Option B
       c) Option C
       d) Option D
    """
    questions = []
    
    # 题目模式
    question_pattern = r'(\d+)\.\s+(.+\?)'
    option_pattern = r'([a-d])\)\s+(.+)'
    
    current_question = None
    
    for page_data in pages_content:
        text = page_data["text"]
        page_num = page_data["page_num"]
        
        for line in text.split('\n'):
            line = line.strip()
            
            # 检测新题目
            q_match = re.match(question_pattern, line)
            if q_match:
                # 保存前一个题目
                if current_question and current_question.get("options"):
                    questions.append(current_question)
                
                current_question = {
                    "number": q_match.group(1),
                    "stem": q_match.group(2),
                    "options": [],
                    "page": page_num,
                    "type": "single_choice"
                }
                continue
            
            # 检测选项
            if current_question:
                opt_match = re.match(option_pattern, line, re.IGNORECASE)
                if opt_match:
                    current_question["options"].append({
                        "key": opt_match.group(1).upper(),
                        "value": opt_match.group(2)
                    })
    
    # 保存最后一个题目
    if current_question and current_question.get("options"):
        questions.append(current_question)
    
    return questions


def analyze_pdf(pdf_path: str) -> Dict:
    """
    分析 PDF 并返回结构化数据
    """
    logger.info(f"开始分析 PDF: {pdf_path}")
    
    # 1. 提取文本
    pages_content = extract_pdf_text(pdf_path)
    logger.info(f"提取到 {len(pages_content)} 页内容")
    
    # 2. 检测章节
    chapters = detect_chapters(pages_content)
    logger.info(f"检测到 {len(chapters)} 个章节")
    
    # 3. 提取知识点
    knowledge_points = extract_knowledge_points(pages_content, chapters)
    logger.info(f"提取到 {len(knowledge_points)} 个知识点")
    
    # 4. 提取题目
    questions = extract_questions(pages_content)
    logger.info(f"提取到 {len(questions)} 道题目")
    
    return {
        "total_pages": len(pages_content),
        "chapters": chapters,
        "knowledge_points": knowledge_points,
        "questions": questions,
        "pages_sample": pages_content[:5]  # 前5页样本
    }


def save_to_json(data: Dict, output_path: str):
    """保存分析结果到 JSON 文件"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"分析结果已保存到: {output_path}")


def import_to_database(data: Dict, exam_id: int, source_id: int, creator: str = "system"):
    """
    将分析结果导入数据库
    """
    from sqlmodel import Session
    from app.core.db import engine
    from app.models.studySourceSection import StudySourceSection
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
    from app.models.studyQuestion import StudyQuestion
    from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
    
    with Session(engine) as session:
        # 1. 创建章节 (StudySourceSection)
        section_map = {}  # chapter_name -> section_id
        
        for idx, chapter in enumerate(data["chapters"]):
            section = StudySourceSection(
                source_id=source_id,
                chapter=chapter.get("chapter", f"Chapter {idx + 1}"),
                section=chapter.get("title", ""),
                page_start=chapter.get("page_start"),
                page_end=chapter.get("page_end"),
                anchor_text=chapter.get("raw_line", "")[:1024],
                creator=creator
            )
            session.add(section)
            session.flush()
            section_map[chapter.get("chapter", f"Chapter {idx + 1}")] = section.id
            logger.info(f"创建章节: {section.chapter} - {section.section}")
        
        # 2. 创建知识点 (StudyKnowledgeNode)
        kp_map = {}  # title -> knowledge_node_id
        
        for idx, kp in enumerate(data["knowledge_points"]):
            code = f"KP_{exam_id}_{idx + 1:04d}"
            
            knowledge_node = StudyKnowledgeNode(
                exam_id=exam_id,
                code=code,
                title=kp.get("title", "")[:255],
                description=kp.get("description", "")[:9999],
                importance=kp.get("importance", "medium"),
                creator=creator
            )
            session.add(knowledge_node)
            session.flush()
            kp_map[kp.get("title", "")] = knowledge_node.id
            
            # 3. 创建知识点与章节映射 (StudyKnowledgeSourceSection)
            chapter_name = kp.get("chapter", "")
            if chapter_name in section_map:
                mapping = StudyKnowledgeSourceSection(
                    knowledge_node_id=knowledge_node.id,
                    source_section_id=section_map[chapter_name],
                    creator=creator
                )
                session.add(mapping)
        
        logger.info(f"创建 {len(kp_map)} 个知识点")
        
        # 4. 创建题目 (StudyQuestion)
        for idx, q in enumerate(data["questions"]):
            question = StudyQuestion(
                exam_id=exam_id,
                type=q.get("type", "single_choice"),
                stem=q.get("stem", "")[:9999],
                options=json.dumps(q.get("options", []), ensure_ascii=False),
                answer="",  # 需要人工填写
                explanation_raw="",
                explanation_human="",
                status=0,  # 待审核
                creator=creator
            )
            session.add(question)
            session.flush()
            
            # 5. 简单的知识点关联 (基于关键词匹配)
            # TODO: 可以使用更智能的匹配算法
        
        logger.info(f"创建 {len(data['questions'])} 道题目")
        
        session.commit()
        logger.info("数据导入完成!")


def main():
    parser = argparse.ArgumentParser(description="ICBC Class 4 驾照教材 PDF 处理脚本")
    parser.add_argument("--pdf", required=True, help="PDF 文件路径")
    parser.add_argument("--output", help="输出 JSON 文件路径（可选）")
    parser.add_argument("--exam-id", type=int, help="考试 ID（用于导入数据库）")
    parser.add_argument("--source-id", type=int, help="来源 ID（用于导入数据库）")
    parser.add_argument("--creator", default="system", help="创建者")
    parser.add_argument("--import-db", action="store_true", help="是否导入数据库")
    parser.add_argument("--analyze-only", action="store_true", help="仅分析，不导入")
    
    args = parser.parse_args()
    
    # 检查 PDF 文件
    if not Path(args.pdf).exists():
        logger.error(f"PDF 文件不存在: {args.pdf}")
        sys.exit(1)
    
    # 分析 PDF
    data = analyze_pdf(args.pdf)
    
    # 保存分析结果
    if args.output:
        save_to_json(data, args.output)
    else:
        # 默认保存到同目录
        output_path = str(Path(args.pdf).with_suffix('.analysis.json'))
        save_to_json(data, output_path)
    
    # 打印摘要
    print("\n" + "=" * 60)
    print("PDF 分析摘要")
    print("=" * 60)
    print(f"总页数: {data['total_pages']}")
    print(f"检测到章节: {len(data['chapters'])}")
    print(f"提取知识点: {len(data['knowledge_points'])}")
    print(f"提取题目: {len(data['questions'])}")
    print("=" * 60)
    
    # 显示章节列表
    if data['chapters']:
        print("\n章节列表:")
        for ch in data['chapters'][:20]:  # 最多显示20个
            print(f"  - [{ch.get('page_start', '?')}-{ch.get('page_end', '?')}] {ch.get('chapter', '')} {ch.get('title', '')}")
        if len(data['chapters']) > 20:
            print(f"  ... 还有 {len(data['chapters']) - 20} 个章节")
    
    # 导入数据库
    if args.import_db and not args.analyze_only:
        if not args.exam_id or not args.source_id:
            logger.error("导入数据库需要指定 --exam-id 和 --source-id")
            sys.exit(1)
        
        import_to_database(data, args.exam_id, args.source_id, args.creator)


if __name__ == "__main__":
    main()


