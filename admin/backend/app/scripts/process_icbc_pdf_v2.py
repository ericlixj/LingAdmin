"""
ICBC Class 4 驾照教材 PDF 处理脚本 v2
更细粒度的章节拆分 + 结构化知识点提取

使用方法:
    cd admin/backend
    uv run python -m app.scripts.process_icbc_pdf_v2 --pdf /path/to/pdf

输出:
    1. sections.json - 章节和段落数据
    2. knowledge_points.json - 结构化知识点
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("请先安装 pdfplumber: pip install pdfplumber")
    sys.exit(1)


# 章节定义（基于目录分析）
CHAPTERS = [
    {"num": 1, "title": "Getting your driver's licence", "page_start": 22, "page_end": 33},
    {"num": 2, "title": "Heavy vehicle braking", "page_start": 34, "page_end": 44},
    {"num": 3, "title": "Basic driving skills", "page_start": 45, "page_end": 83},
    {"num": 4, "title": "Fuel-efficient driving", "page_start": 84, "page_end": 91},
    {"num": 5, "title": "Skills for driving trucks and trailers", "page_start": 92, "page_end": 133},
    {"num": 6, "title": "Skills for driving buses, taxis, limousines and ride-hailing vehicles", "page_start": 134, "page_end": 147},
    {"num": 7, "title": "Hours of service requirements", "page_start": 148, "page_end": 157},
    {"num": 8, "title": "Air brakes", "page_start": 158, "page_end": 200},
    {"num": 9, "title": "Air brake adjustment", "page_start": 201, "page_end": 210},
    {"num": 10, "title": "Vehicle and air brake pre-trip inspections", "page_start": 211, "page_end": 248},
    {"num": 11, "title": "Signs, signals and road markings", "page_start": 249, "page_end": 261},
    {"num": 12, "title": "Industrial roads", "page_start": 262, "page_end": 266},
    {"num": 13, "title": "For more information", "page_start": 267, "page_end": 281},
]


def extract_pdf_pages(pdf_path: str) -> List[Dict]:
    """从 PDF 中提取每页文本"""
    pages = []
    
    with pdfplumber.open(pdf_path) as pdf:
        logger.info(f"PDF 共 {len(pdf.pages)} 页")
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            # 清理文本：合并换行，去除多余空格
            clean_text = re.sub(r'\n+', '\n', text)
            clean_text = re.sub(r'[ \t]+', ' ', clean_text)
            
            pages.append({
                "page_num": i + 1,
                "text": text,
                "clean_text": clean_text
            })
            
            if (i + 1) % 50 == 0:
                logger.info(f"已处理 {i + 1} 页...")
    
    return pages


def extract_sections(pages: List[Dict]) -> List[Dict]:
    """
    提取章节和段落
    每个小节作为一个 StudySourceSection
    """
    sections = []
    section_id = 0
    
    # 小节标题模式
    subsection_patterns = [
        # 常见的小节标题格式
        r'^([A-Z][a-z]+(?:\s+[a-z]+)*)\s*$',  # 首字母大写的标题行
        r'^([A-Z][A-Za-z\s]{3,50})\s*$',  # 全大写或混合大小写标题
        r'^((?:The|How|What|When|Where|Why|If|Before|After|During)\s+[a-z].{10,60})\s*$',  # 以特定词开头的标题
    ]
    
    for chapter in CHAPTERS:
        chapter_num = chapter["num"]
        chapter_title = chapter["title"]
        page_start = chapter["page_start"]
        page_end = chapter["page_end"]
        
        # 首先添加章节本身
        section_id += 1
        sections.append({
            "id": section_id,
            "chapter": f"Chapter {chapter_num}",
            "section": chapter_title,
            "page_start": page_start,
            "page_end": page_end,
            "content": "",  # 章节概述
            "level": 1,  # 章节级别
        })
        
        # 提取该章节内的段落
        chapter_content = []
        for page in pages:
            if page_start <= page["page_num"] <= page_end:
                chapter_content.append(page["clean_text"])
        
        full_text = "\n".join(chapter_content)
        
        # 按段落分割（双换行或特定模式）
        paragraphs = re.split(r'\n(?=[A-Z])', full_text)
        
        current_subsection = None
        current_content = []
        
        for para in paragraphs:
            para = para.strip()
            if not para or len(para) < 10:
                continue
            
            # 检查是否是小节标题
            is_title = False
            for pattern in subsection_patterns:
                if re.match(pattern, para[:100]):
                    # 保存前一个小节
                    if current_subsection and current_content:
                        section_id += 1
                        content_text = " ".join(current_content)[:1024]
                        sections.append({
                            "id": section_id,
                            "chapter": f"Chapter {chapter_num}",
                            "section": current_subsection[:255],
                            "page_start": page_start,
                            "page_end": page_end,
                            "content": content_text,
                            "level": 2,
                        })
                    
                    # 开始新小节
                    current_subsection = para[:100].strip()
                    current_content = []
                    is_title = True
                    break
            
            if not is_title:
                # 添加到当前内容
                if len(para) > 50:  # 只保留有意义的段落
                    current_content.append(para)
        
        # 保存最后一个小节
        if current_subsection and current_content:
            section_id += 1
            content_text = " ".join(current_content)[:1024]
            sections.append({
                "id": section_id,
                "chapter": f"Chapter {chapter_num}",
                "section": current_subsection[:255],
                "page_start": page_start,
                "page_end": page_end,
                "content": content_text,
                "level": 2,
            })
    
    return sections


def generate_code(title: str, chapter_num: int, index: int) -> str:
    """
    生成知识点代码
    格式: CH{chapter}.{category}.{short_name}
    """
    # 提取关键词
    title_lower = title.lower()
    
    # 根据章节和内容生成代码
    chapter_prefix = f"CH{chapter_num}"
    
    # 提取主要词汇
    words = re.findall(r'[a-zA-Z]+', title)
    if words:
        # 取前2-3个有意义的词
        key_words = [w.upper() for w in words[:3] if len(w) > 2]
        if key_words:
            code = f"{chapter_prefix}.{'_'.join(key_words[:2])}"
        else:
            code = f"{chapter_prefix}.KP{index:03d}"
    else:
        code = f"{chapter_prefix}.KP{index:03d}"
    
    return code[:64]  # 限制长度


def extract_knowledge_points(pages: List[Dict]) -> List[Dict]:
    """
    提取结构化知识点
    格式: {code, title, description}
    """
    knowledge_points = []
    kp_index = 0
    
    # 定义知识点提取模式
    # 格式: (正则模式, 标题提取组, 描述提取组, 重要性)
    patterns = [
        # 定义类: "X means Y" 或 "X is Y"
        (r'([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+(?:means|is|refers to|is defined as)\s+([^.]+\.)', 1, 2, "high"),
        
        # 要求类: "You must X"
        (r'(You must)\s+([^.]+\.)', None, 2, "high"),
        
        # 禁止类: "Never X" 或 "Do not X"  
        (r'(Never|Do not|Don\'t)\s+([^.]+\.)', None, 2, "high"),
        
        # 总是类: "Always X"
        (r'(Always)\s+([^.]+\.)', None, 2, "high"),
        
        # 数值规则: 包含数字的规则
        (r'([A-Z][^.]*(?:maximum|minimum|at least|no more than|within)\s+\d+[^.]+\.)', None, 1, "high"),
        
        # 时间规则
        (r'([A-Z][^.]*\d+\s*(?:hours?|minutes?|seconds?|days?)[^.]+\.)', None, 1, "medium"),
        
        # 距离规则
        (r'([A-Z][^.]*\d+\s*(?:metres?|meters?|feet|km|kilometres?)[^.]+\.)', None, 1, "medium"),
    ]
    
    # 用于生成更好标题的关键词映射
    title_keywords = {
        "must": "Requirement",
        "never": "Prohibition",
        "always": "Best Practice",
        "maximum": "Maximum Limit",
        "minimum": "Minimum Requirement",
        "speed": "Speed Regulation",
        "distance": "Distance Rule",
        "time": "Time Limit",
        "hours": "Hours Regulation",
        "brake": "Brake",
        "stop": "Stopping",
        "turn": "Turning",
        "lane": "Lane",
        "signal": "Signal",
        "mirror": "Mirror",
        "load": "Load",
        "weight": "Weight",
        "passenger": "Passenger",
        "safety": "Safety",
    }
    
    for chapter in CHAPTERS:
        chapter_num = chapter["num"]
        page_start = chapter["page_start"]
        page_end = chapter["page_end"]
        
        # 收集章节文本
        chapter_text = ""
        for page in pages:
            if page_start <= page["page_num"] <= page_end:
                chapter_text += " " + page["clean_text"]
        
        # 清理文本
        chapter_text = re.sub(r'\s+', ' ', chapter_text)
        
        for pattern, title_group, desc_group, importance in patterns:
            matches = re.finditer(pattern, chapter_text, re.IGNORECASE)
            
            for match in matches:
                kp_index += 1
                
                # 提取描述
                if desc_group:
                    description = match.group(desc_group).strip()
                else:
                    description = match.group(0).strip()
                
                # 生成标题
                if title_group and match.group(title_group):
                    title = match.group(title_group).strip()
                else:
                    # 从描述中提取关键词生成标题
                    title = None
                    desc_lower = description.lower()
                    for keyword, label in title_keywords.items():
                        if keyword in desc_lower:
                            # 提取关键上下文
                            title = label
                            break
                    
                    if not title:
                        # 使用描述的前几个词
                        words = description.split()[:5]
                        title = " ".join(words)
                
                # 限制长度
                title = title[:100] if title else "Knowledge Point"
                description = description[:1000]
                
                # 生成代码
                code = generate_code(title, chapter_num, kp_index)
                
                # 避免重复
                if not any(kp["description"] == description for kp in knowledge_points):
                    knowledge_points.append({
                        "code": code,
                        "title": title,
                        "description": description,
                        "chapter": chapter_num,
                        "importance": importance,
                    })
    
    return knowledge_points


def extract_definitions(pages: List[Dict]) -> List[Dict]:
    """
    专门提取定义类知识点
    格式: {code, title, description}
    
    title: 简短的术语名称
    description: 完整的定义解释
    """
    definitions = []
    seen_titles = set()
    
    for chapter in CHAPTERS:
        chapter_num = chapter["num"]
        chapter_abbr = chapter["title"].split()[0].upper()[:3]  # 章节缩写
        page_start = chapter["page_start"]
        page_end = chapter["page_end"]
        
        chapter_text = ""
        for page in pages:
            if page_start <= page["page_num"] <= page_end:
                chapter_text += " " + page["clean_text"]
        
        chapter_text = re.sub(r'\s+', ' ', chapter_text)
        
        # 定义模式 - 提取 "Term" 和 "Definition"
        def_patterns = [
            # "Term means definition" - 标准定义格式
            (r'\b([A-Z][a-z]+(?:[-\s][a-z]+){0,3})\s+means\s+([^.]+\.)', True),
            # "Term is definition" - 但排除常见句型
            (r'\b([A-Z][a-z]+(?:[-\s][a-z]+){0,2})\s+is\s+((?:a|an|the|any|when|where)[^.]+\.)', True),
            # "Term refers to definition"
            (r'\b([A-Z][a-z]+(?:[-\s][a-z]+){0,2})\s+refers\s+to\s+([^.]+\.)', True),
            # "Term: definition" 格式
            (r'\b([A-Z][a-z]+(?:[-\s][a-z]+){0,2}):\s+([A-Z][^.]{20,}\.)', True),
            # "The term is..." 格式
            (r'\bThe\s+([a-z]+(?:[-\s][a-z]+){0,2})\s+is\s+((?:a|an|the|any|when|where|defined)[^.]+\.)', False),
        ]
        
        for pattern, capitalize_term in def_patterns:
            matches = re.finditer(pattern, chapter_text, re.IGNORECASE if not capitalize_term else 0)
            
            for match in matches:
                term = match.group(1).strip()
                definition = match.group(2).strip()
                
                # 清理术语
                term = re.sub(r'\s+', ' ', term)
                if capitalize_term:
                    term = term.title()
                else:
                    term = term.capitalize()
                
                # 跳过太短或太通用的术语
                if len(term) < 3 or term.lower() in ['the', 'this', 'that', 'here', 'there', 'make', 'sure', 'your']:
                    continue
                
                # 跳过太短的定义
                if len(definition) < 15:
                    continue
                
                # 标准化标题
                title = term[:100]
                
                # 生成有意义的代码
                term_code = re.sub(r'[^A-Za-z0-9]', '_', term.upper())
                term_code = re.sub(r'_+', '_', term_code).strip('_')
                code = f"{chapter_abbr}.{term_code}"[:64]
                
                # 避免重复
                title_key = title.lower()
                if title_key not in seen_titles:
                    seen_titles.add(title_key)
                    definitions.append({
                        "code": code,
                        "title": title,
                        "description": definition[:1000],
                        "chapter": chapter_num,
                        "importance": "high",
                        "type": "definition"
                    })
    
    return definitions


def extract_rules(pages: List[Dict]) -> List[Dict]:
    """
    提取规则类知识点
    格式: {code, title, description}
    """
    rules = []
    seen_desc = set()
    
    for chapter in CHAPTERS:
        chapter_num = chapter["num"]
        chapter_abbr = chapter["title"].split()[0].upper()[:3]
        page_start = chapter["page_start"]
        page_end = chapter["page_end"]
        
        chapter_text = ""
        for page in pages:
            if page_start <= page["page_num"] <= page_end:
                chapter_text += " " + page["clean_text"]
        
        chapter_text = re.sub(r'\s+', ' ', chapter_text)
        
        # 规则模式: (pattern, title_prefix, importance)
        rule_patterns = [
            # 必须要求
            (r'You\s+must\s+([^.]+\.)', "Requirement", "high"),
            (r'Drivers?\s+must\s+([^.]+\.)', "Driver requirement", "high"),
            (r'required\s+to\s+([^.]+\.)', "Requirement", "high"),
            
            # 禁止事项
            (r'You\s+must\s+not\s+([^.]+\.)', "Prohibition", "high"),
            (r'Never\s+([^.]+\.)', "Never", "high"),
            (r'Do\s+not\s+([^.]+\.)', "Do not", "high"),
            (r'illegal\s+to\s+([^.]+\.)', "Illegal action", "high"),
            
            # 最佳实践
            (r'Always\s+([^.]+\.)', "Best practice", "high"),
            (r'You\s+should\s+([^.]+\.)', "Recommendation", "medium"),
            
            # 数值规则
            (r'maximum\s+(?:of\s+)?(\d+[^.]+\.)', "Maximum limit", "high"),
            (r'minimum\s+(?:of\s+)?(\d+[^.]+\.)', "Minimum requirement", "high"),
            (r'at\s+least\s+(\d+[^.]+\.)', "Minimum", "high"),
            (r'no\s+more\s+than\s+(\d+[^.]+\.)', "Maximum", "high"),
            
            # 速度限制
            (r'speed\s+limit\s+(?:is\s+)?(\d+[^.]+\.)', "Speed limit", "high"),
            
            # 距离规则
            (r'following\s+distance\s+([^.]+\.)', "Following distance", "high"),
            (r'stopping\s+distance\s+([^.]+\.)', "Stopping distance", "high"),
        ]
        
        rule_index = 0
        for pattern, title_prefix, importance in rule_patterns:
            matches = re.finditer(pattern, chapter_text, re.IGNORECASE)
            
            for match in matches:
                rule_index += 1
                content = match.group(1).strip() if match.lastindex >= 1 else match.group(0).strip()
                
                # 完整的规则描述
                full_match = match.group(0).strip()
                
                # 跳过太短的
                if len(content) < 15:
                    continue
                
                # 生成标题
                # 从内容中提取关键信息作为标题
                title = f"{title_prefix}: {content[:80]}"
                if len(title) > 100:
                    title = title[:97] + "..."
                
                # 生成代码
                code_suffix = re.sub(r'[^A-Za-z0-9]', '_', content[:20].upper())
                code_suffix = re.sub(r'_+', '_', code_suffix).strip('_')
                code = f"{chapter_abbr}.RULE.{code_suffix}"[:64]
                
                # 避免重复
                desc_key = full_match.lower()[:100]
                if desc_key not in seen_desc:
                    seen_desc.add(desc_key)
                    rules.append({
                        "code": code,
                        "title": title,
                        "description": full_match[:1000],
                        "chapter": chapter_num,
                        "importance": importance,
                        "type": "rule"
                    })
    
    return rules


def main():
    parser = argparse.ArgumentParser(description="ICBC PDF 处理脚本 v2")
    parser.add_argument("--pdf", required=True, help="PDF 文件路径")
    parser.add_argument("--output-dir", default=".", help="输出目录")
    
    args = parser.parse_args()
    
    if not Path(args.pdf).exists():
        logger.error(f"PDF 文件不存在: {args.pdf}")
        sys.exit(1)
    
    output_dir = Path(args.output_dir)
    
    # 1. 提取页面
    logger.info("提取 PDF 页面...")
    pages = extract_pdf_pages(args.pdf)
    logger.info(f"提取到 {len(pages)} 页")
    
    # 2. 提取章节和段落
    logger.info("提取章节和段落...")
    sections = extract_sections(pages)
    logger.info(f"提取到 {len(sections)} 个章节/段落")
    
    # 3. 提取定义
    logger.info("提取定义...")
    definitions = extract_definitions(pages)
    logger.info(f"提取到 {len(definitions)} 个定义")
    
    # 4. 提取规则
    logger.info("提取规则...")
    rules = extract_rules(pages)
    logger.info(f"提取到 {len(rules)} 条规则")
    
    # 合并所有知识点
    all_knowledge = definitions + rules
    
    # 去重（按 description 去重）
    seen_desc = set()
    unique_knowledge = []
    for kp in all_knowledge:
        desc_key = kp["description"].lower()[:100]
        if desc_key not in seen_desc:
            seen_desc.add(desc_key)
            unique_knowledge.append(kp)
    
    # 5. 保存结果
    sections_file = output_dir / "icbc_sections.json"
    with open(sections_file, 'w', encoding='utf-8') as f:
        json.dump(sections, f, ensure_ascii=False, indent=2)
    logger.info(f"章节数据已保存到: {sections_file}")
    
    knowledge_file = output_dir / "icbc_knowledge_points.json"
    with open(knowledge_file, 'w', encoding='utf-8') as f:
        json.dump(unique_knowledge, f, ensure_ascii=False, indent=2)
    logger.info(f"知识点数据已保存到: {knowledge_file}")
    
    # 打印摘要
    print("\n" + "=" * 60)
    print("处理摘要")
    print("=" * 60)
    print(f"总页数: {len(pages)}")
    print(f"章节/段落数: {len(sections)}")
    print(f"  - 章节级别(level=1): {len([s for s in sections if s['level'] == 1])}")
    print(f"  - 段落级别(level=2): {len([s for s in sections if s['level'] == 2])}")
    print(f"知识点数: {len(unique_knowledge)}")
    print(f"  - 定义类(definition): {len([k for k in unique_knowledge if k.get('type') == 'definition'])}")
    print(f"  - 规则类(rule): {len([k for k in unique_knowledge if k.get('type') == 'rule'])}")
    print(f"  - 高重要性: {len([k for k in unique_knowledge if k['importance'] == 'high'])}")
    print(f"  - 中重要性: {len([k for k in unique_knowledge if k['importance'] == 'medium'])}")
    print("=" * 60)
    
    # 显示样本
    print("\n=== 章节样本 ===")
    for s in sections[:5]:
        print(f"[L{s['level']}] {s['chapter']} - {s['section'][:50]}")
        if s.get('content'):
            print(f"     Content: {s['content'][:80]}...")
    
    print("\n=== 知识点样本 ===")
    for kp in unique_knowledge[:8]:
        print(f"Code: {kp['code']}")
        print(f"Title: {kp['title']}")
        print(f"Description: {kp['description'][:100]}...")
        print("-" * 40)


if __name__ == "__main__":
    main()
