"""
从 ICBC PDF Index 部分提取知识点

Index 包含术语及其页码引用，可以作为知识点的基础

使用方法:
    cd admin/backend
    uv run python -m app.scripts.extract_from_index
"""
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("请先安装 pdfplumber")
    exit(1)

PDF_PATH = "/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/drive_commercial_veh_full.pdf"

# 章节代码映射（根据页码范围）
def get_chapter_code(page: int) -> Tuple[str, int]:
    """根据页码返回章节代码和章节号"""
    ranges = [
        (20, 33, "LIC", 1),
        (32, 44, "BRK", 2),
        (44, 83, "DRV", 3),
        (84, 91, "FUEL", 4),
        (92, 133, "TRK", 5),
        (134, 147, "BUS", 6),
        (148, 157, "HOS", 7),
        (158, 200, "AIR", 8),
        (201, 210, "ADJ", 9),
        (211, 248, "INSP", 10),
        (249, 261, "SIGN", 11),
        (262, 266, "IND", 12),
    ]
    for start, end, code, num in ranges:
        if start <= page <= end:
            return code, num
    return "GEN", 0


def parse_index_entries(pdf) -> List[Dict]:
    """解析 Index 条目"""
    entries = []
    
    # Index 页面范围 (272-278)
    index_text = ""
    for i in range(271, 278):
        if i < len(pdf.pages):
            page = pdf.pages[i]
            text = page.extract_text() or ""
            index_text += " " + text
    
    # 清理文本
    index_text = re.sub(r'\s+', ' ', index_text)
    
    # 提取条目模式: "term ...page" 或 "term page-page"
    # 例如: "brake fade 19", "air brakes 141-183", "ABS 23-24"
    patterns = [
        # 术语 ... 页码
        r'([A-Za-z][A-Za-z\s\-\']+?)\s*\.{2,}\s*(\d+(?:\s*[-–]\s*\d+)?)',
        # 术语 页码-页码
        r'([A-Za-z][A-Za-z\s\-\']{2,50})\s+(\d{1,3}(?:\s*[-–]\s*\d{1,3})?)\s',
        # 带括号的术语
        r'([A-Za-z][A-Za-z\s\-\']+?\s*\([^)]+\))\s*\.{0,}\s*(\d+(?:\s*[-–]\s*\d+)?)',
    ]
    
    seen = set()
    for pattern in patterns:
        for match in re.finditer(pattern, index_text):
            term = match.group(1).strip()
            pages = match.group(2).strip()
            
            # 清理术语
            term = re.sub(r'\s+', ' ', term)
            term = term.strip(' .-')
            
            # 过滤
            if len(term) < 3:
                continue
            if term.lower() in ['see', 'see also', 'and', 'the', 'for', 'with']:
                continue
            if term.lower().startswith('see '):
                continue
            
            # 解析页码
            page_match = re.match(r'(\d+)', pages)
            if page_match:
                first_page = int(page_match.group(1))
            else:
                continue
            
            # 获取章节
            chapter_code, chapter_num = get_chapter_code(first_page)
            
            term_key = term.lower()
            if term_key not in seen:
                seen.add(term_key)
                entries.append({
                    "term": term,
                    "pages": pages,
                    "first_page": first_page,
                    "chapter_code": chapter_code,
                    "chapter_num": chapter_num
                })
    
    return entries


def extract_definition_for_term(pdf, term: str, page_num: int) -> str:
    """从指定页面提取术语的定义"""
    if page_num < 1 or page_num > len(pdf.pages):
        return ""
    
    page = pdf.pages[page_num - 1]
    text = page.extract_text() or ""
    text = re.sub(r'\s+', ' ', text)
    
    # 搜索包含该术语的句子
    term_lower = term.lower()
    term_pattern = re.escape(term_lower)
    
    # 尝试找到定义性句子
    patterns = [
        # "Term means/is definition"
        rf'{term_pattern}\s+(?:means|is|refers to|are)\s+([^.]+\.)',
        # "The term is..."
        rf'[Tt]he\s+{term_pattern}\s+(?:is|are|means)\s+([^.]+\.)',
        # 句子中包含术语
        rf'([^.]*{term_pattern}[^.]+\.)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            result = match.group(0).strip()
            if len(result) > 30:
                return result[:500]
    
    return ""


def main():
    logger.info(f"打开 PDF: {PDF_PATH}")
    
    knowledge_points = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        logger.info(f"PDF 共 {len(pdf.pages)} 页")
        
        # 解析 Index
        logger.info("解析 Index 条目...")
        entries = parse_index_entries(pdf)
        logger.info(f"找到 {len(entries)} 个 Index 条目")
        
        # 为每个条目提取定义
        logger.info("提取知识点...")
        for idx, entry in enumerate(entries):
            term = entry["term"]
            first_page = entry["first_page"]
            chapter_code = entry["chapter_code"]
            chapter_num = entry["chapter_num"]
            
            # 尝试提取定义
            description = extract_definition_for_term(pdf, term, first_page)
            
            if not description:
                # 如果找不到定义，使用通用描述
                description = f"Related to {term}. See page {entry['pages']} for details."
            
            # 生成代码
            term_code = re.sub(r'[^A-Za-z0-9]', '_', term.upper())[:20]
            code = f"{chapter_code}.IDX.{term_code}"[:64]
            
            knowledge_points.append({
                "code": code,
                "title": term.title()[:100],
                "description": description[:1000],
                "chapter": chapter_num,
                "importance": "medium",
                "type": "index_term",
                "source_page": first_page
            })
            
            if (idx + 1) % 50 == 0:
                logger.info(f"已处理 {idx + 1} 个条目...")
    
    # 去重
    seen_titles = set()
    unique_kps = []
    for kp in knowledge_points:
        title_key = kp["title"].lower()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_kps.append(kp)
    
    # 保存
    output_file = Path("/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/icbc_knowledge_index.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_kps, f, ensure_ascii=False, indent=2)
    
    # 统计
    print("\n" + "=" * 60)
    print("Index 知识点提取结果")
    print("=" * 60)
    print(f"总知识点数: {len(unique_kps)}")
    
    # 按章节统计
    chapter_counts = {}
    for kp in unique_kps:
        ch = kp.get("chapter", 0)
        chapter_counts[ch] = chapter_counts.get(ch, 0) + 1
    
    print("\n按章节分布:")
    for ch in sorted(chapter_counts.keys()):
        print(f"  Chapter {ch}: {chapter_counts[ch]}")
    
    print(f"\n已保存到: {output_file}")
    print("=" * 60)
    
    # 显示样本
    print("\n=== 样本 ===")
    for kp in unique_kps[:15]:
        print(f"Code: {kp['code']}")
        print(f"Title: {kp['title']}")
        print(f"Page: {kp['source_page']}")
        print(f"Desc: {kp['description'][:100]}...")
        print("-" * 40)


if __name__ == "__main__":
    main()
