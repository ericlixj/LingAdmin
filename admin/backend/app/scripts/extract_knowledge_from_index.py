"""
从 ICBC PDF Index 提取知识点

1. 从 Index (第272-278页) 解析所有术语和页码
2. 根据页码去对应页面提取描述内容

使用方法:
    cd admin/backend
    uv run python -m app.scripts.extract_knowledge_from_index
"""
import json
import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("请先安装 pdfplumber")
    exit(1)

PDF_PATH = "/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/drive_commercial_veh_full.pdf"

# 章节代码映射
def get_chapter_info(page: int) -> Tuple[str, int]:
    """根据页码返回章节代码和章节号"""
    ranges = [
        (3, 14, "LIC", 1),    # Getting your driver's licence
        (15, 26, "BRK", 2),   # Heavy vehicle braking
        (27, 66, "DRV", 3),   # Basic driving skills
        (67, 74, "FUEL", 4),  # Fuel-efficient driving
        (75, 116, "TRK", 5),  # Skills for driving trucks and trailers
        (117, 130, "BUS", 6), # Skills for driving buses, taxis...
        (131, 140, "HOS", 7), # Hours of service requirements
        (141, 184, "AIR", 8), # Air brakes
        (185, 194, "ADJ", 9), # Air brake adjustment
        (195, 232, "INSP", 10), # Pre-trip inspections
        (233, 245, "SIGN", 11), # Signs, signals and road markings
        (246, 252, "IND", 12),  # Industrial roads
        (253, 260, "INFO", 13), # For more information
    ]
    for start, end, code, num in ranges:
        if start <= page <= end:
            return code, num
    return "GEN", 0


def parse_index_page(text: str) -> List[Dict]:
    """解析单页 Index 内容
    
    格式: term ..... page 或 term ..... page-page
    每个这样的模式就是一个知识点
    """
    entries = []
    
    # 匹配: term ..... page 或 term ..... page-page
    # 更宽松的正则，允许更多字符
    pattern = r'([A-Za-z][A-Za-z0-9\s\-\'\/\(\),—&–]+?)\s*\.{2,}\s*(\d+(?:\s*[-–,]\s*\d+)*)'
    
    for match in re.finditer(pattern, text):
        term = match.group(1).strip()
        pages_str = match.group(2).strip()
        
        # 清理术语 - 去除换行造成的多余内容
        if '\n' in term:
            parts = term.split('\n')
            term = parts[-1].strip()
        
        # 清理空格
        term = re.sub(r'\s+', ' ', term)
        term = term.strip(' .-,')
        
        # 跳过无效条目
        if len(term) < 2:
            continue
        if term.lower().startswith('see ') or term.lower() == 'see':
            continue
        # 跳过单字母标题（字母索引标记）
        if len(term) == 1 and term.isalpha():
            continue
        if term.lower() == 'index':
            continue
        # 跳过 "See xxx" 引用
        if 'See ' in term:
            continue
        
        # 解析页码
        page_match = re.match(r'(\d+)', pages_str)
        if page_match:
            first_page = int(page_match.group(1))
            
            # 页码范围检查 (1-270 是有效页码)
            if first_page < 1 or first_page > 270:
                continue
            
            # 检查页码范围
            end_match = re.search(r'[-–]\s*(\d+)', pages_str)
            end_page = int(end_match.group(1)) if end_match else first_page
            
            entries.append({
                "term": term,
                "pages_str": pages_str,
                "first_page": first_page,
                "end_page": end_page
            })
    
    return entries


def extract_description_from_page(pdf, term: str, page_num: int, end_page: int) -> str:
    """从指定页面提取术语的描述"""
    if page_num < 1 or page_num > len(pdf.pages):
        return ""
    
    # 收集页面文本（实际PDF页码需要加偏移）
    # Index 中的页码是逻辑页码，PDF 实际页码 = 逻辑页码 + 17
    actual_start = page_num + 17
    actual_end = end_page + 17
    
    all_text = ""
    for p in range(actual_start - 1, min(actual_end + 1, len(pdf.pages))):
        page = pdf.pages[p]
        text = page.extract_text() or ""
        all_text += " " + text
    
    # 清理文本
    all_text = re.sub(r'\s+', ' ', all_text)
    
    term_lower = term.lower()
    # 提取术语中的关键词（去掉常见词）
    stop_words = {'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by'}
    term_words = [w for w in term_lower.split() if w not in stop_words and len(w) > 2]
    
    best_description = ""
    best_score = 0
    
    # 分割成句子
    sentences = re.split(r'(?<=[.!?])\s+', all_text)
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 20 or len(sentence) > 600:
            continue
        
        sentence_lower = sentence.lower()
        
        # 计算匹配分数
        score = 0
        
        # 完整术语匹配
        if term_lower in sentence_lower:
            score += 10
        
        # 关键词匹配
        matched_words = sum(1 for w in term_words if w in sentence_lower)
        score += matched_words * 3
        
        # 定义性句子加分
        if any(phrase in sentence_lower for phrase in ['means', 'is a', 'is the', 'refers to', 'is defined as', 'are used']):
            score += 5
        
        # 包含数字/具体信息加分
        if re.search(r'\d+', sentence):
            score += 2
        
        # 句子太短减分
        if len(sentence) < 50:
            score -= 2
        
        if score > best_score:
            best_score = score
            best_description = sentence
    
    # 如果分数太低，尝试其他方法
    if best_score < 5:
        # 尝试找包含术语的定义性句子
        patterns = [
            rf'[Tt]he\s+{re.escape(term_lower)}\s+(?:is|are|means|refers)\s+[^.]+\.',
            rf'{re.escape(term_lower)}\s+(?:means|is|are|refers)\s+[^.]+\.',
            rf'[A-Z][^.]*{re.escape(term_lower)}[^.]+\.',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, all_text, re.IGNORECASE)
            if match:
                desc = match.group(0).strip()
                if 30 < len(desc) < 600:
                    best_description = desc
                    break
    
    return best_description[:1000] if best_description else ""


def main():
    logger.info(f"打开 PDF: {PDF_PATH}")
    
    knowledge_points = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        logger.info(f"PDF 共 {len(pdf.pages)} 页")
        
        # 解析 Index 页面 (272-278页，即索引271-277)
        logger.info("解析 Index...")
        all_entries = []
        
        for page_idx in range(271, 278):
            if page_idx < len(pdf.pages):
                page = pdf.pages[page_idx]
                text = page.extract_text() or ""
                entries = parse_index_page(text)
                all_entries.extend(entries)
                logger.info(f"  Page {page_idx + 1}: 找到 {len(entries)} 个条目")
        
        logger.info(f"共解析到 {len(all_entries)} 个 Index 条目")
        
        # 去重
        seen_terms = set()
        unique_entries = []
        for entry in all_entries:
            term_key = entry["term"].lower()
            if term_key not in seen_terms:
                seen_terms.add(term_key)
                unique_entries.append(entry)
        
        logger.info(f"去重后: {len(unique_entries)} 个条目")
        
        # 为每个条目提取描述
        logger.info("提取知识点描述...")
        for idx, entry in enumerate(unique_entries):
            term = entry["term"]
            first_page = entry["first_page"]
            end_page = entry["end_page"]
            
            # 获取章节信息
            chapter_code, chapter_num = get_chapter_info(first_page)
            
            # 提取描述
            description = extract_description_from_page(pdf, term, first_page, end_page)
            
            if not description:
                description = f"See page {entry['pages_str']} for detailed information about {term}."
            
            # 生成代码
            term_code = re.sub(r'[^A-Za-z0-9]', '_', term.upper())[:30]
            term_code = re.sub(r'_+', '_', term_code).strip('_')
            code = f"{chapter_code}.{term_code}"[:64]
            
            # 标题格式: term(pages)
            title_with_pages = f"{term.strip()}({entry['pages_str']})"
            
            knowledge_points.append({
                "code": code,
                "title": title_with_pages[:255],
                "description": description,
                "chapter": chapter_num,
                "importance": "high",
                "source_pages": entry["pages_str"]
            })
            
            if (idx + 1) % 50 == 0:
                logger.info(f"  已处理 {idx + 1}/{len(unique_entries)} 个条目...")
        
        logger.info(f"提取完成: {len(knowledge_points)} 个知识点")
    
    # 保存
    output_file = Path("/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/icbc_knowledge_from_index.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(knowledge_points, f, ensure_ascii=False, indent=2)
    
    # 统计
    print("\n" + "=" * 60)
    print("知识点提取结果")
    print("=" * 60)
    print(f"总知识点数: {len(knowledge_points)}")
    
    # 按章节统计
    chapter_counts = {}
    for kp in knowledge_points:
        ch = kp.get("chapter", 0)
        chapter_counts[ch] = chapter_counts.get(ch, 0) + 1
    
    print("\n按章节分布:")
    for ch in sorted(chapter_counts.keys()):
        print(f"  Chapter {ch}: {chapter_counts[ch]}")
    
    # 有描述的数量
    with_desc = len([k for k in knowledge_points if not k["description"].startswith("See page")])
    print(f"\n有详细描述: {with_desc}")
    print(f"仅页码引用: {len(knowledge_points) - with_desc}")
    
    print(f"\n已保存到: {output_file}")
    print("=" * 60)
    
    # 显示样本
    print("\n=== 样本 (有描述的) ===")
    samples = [k for k in knowledge_points if not k["description"].startswith("See page")][:10]
    for kp in samples:
        print(f"Title: {kp['title']}")
        print(f"Code: {kp['code']}")
        print(f"Pages: {kp['source_pages']}")
        print(f"Desc: {kp['description'][:150]}...")
        print("-" * 50)


if __name__ == "__main__":
    main()


