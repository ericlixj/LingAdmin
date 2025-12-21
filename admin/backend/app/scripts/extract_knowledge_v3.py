"""
从 ICBC PDF 中提取结构化知识点 v3

格式: {code, title, description}

使用方法:
    cd admin/backend
    uv run python -m app.scripts.extract_knowledge_v3
"""
import json
import re
from pathlib import Path
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    logger.error("请先安装 pdfplumber")
    exit(1)

# 章节配置
CHAPTERS = [
    {"num": 1, "code": "LIC", "title": "Getting your driver's licence", "page_start": 20, "page_end": 33},
    {"num": 2, "code": "BRK", "title": "Heavy vehicle braking", "page_start": 32, "page_end": 44},
    {"num": 3, "code": "DRV", "title": "Basic driving skills", "page_start": 44, "page_end": 83},
    {"num": 4, "code": "FUEL", "title": "Fuel-efficient driving", "page_start": 84, "page_end": 91},
    {"num": 5, "code": "TRK", "title": "Skills for driving trucks and trailers", "page_start": 92, "page_end": 133},
    {"num": 6, "code": "BUS", "title": "Skills for driving buses, taxis, limousines", "page_start": 134, "page_end": 147},
    {"num": 7, "code": "HOS", "title": "Hours of service requirements", "page_start": 148, "page_end": 157},
    {"num": 8, "code": "AIR", "title": "Air brakes", "page_start": 158, "page_end": 200},
    {"num": 9, "code": "ADJ", "title": "Air brake adjustment", "page_start": 201, "page_end": 210},
    {"num": 10, "code": "INSP", "title": "Pre-trip inspections", "page_start": 211, "page_end": 248},
    {"num": 11, "code": "SIGN", "title": "Signs, signals and road markings", "page_start": 249, "page_end": 261},
    {"num": 12, "code": "IND", "title": "Industrial roads", "page_start": 262, "page_end": 266},
]

PDF_PATH = "/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/drive_commercial_veh_full.pdf"


def clean_text(text: str) -> str:
    """清理文本"""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)  # 去除页码
    return text.strip()


def extract_chapter_text(pdf, chapter: Dict) -> str:
    """提取章节文本"""
    text = ""
    for i in range(chapter["page_start"] - 1, min(chapter["page_end"], len(pdf.pages))):
        page = pdf.pages[i]
        page_text = page.extract_text() or ""
        text += " " + page_text
    return clean_text(text)


def generate_code(chapter_code: str, category: str, index: int) -> str:
    """生成知识点代码"""
    return f"{chapter_code}.{category}.{index:03d}"


def extract_definitions(text: str, chapter_code: str) -> List[Dict]:
    """提取定义类知识点"""
    definitions = []
    idx = 0
    
    patterns = [
        # "Term means definition"
        (r'\b([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+means\s+([^.]+(?:\.[^.]+)?\.)', 'DEF'),
        # "Term is definition" (a/an/the/any/when...)
        (r'\b([A-Z][a-z]+(?:\s+[a-z]+){0,2})\s+is\s+((?:a|an|the|any|when|where|defined)[^.]+\.)', 'DEF'),
        # "Term refers to definition"
        (r'\b([A-Z][a-z]+(?:\s+[a-z]+){0,2})\s+refers\s+to\s+([^.]+\.)', 'DEF'),
        # "The term is when/where..."
        (r'[Tt]he\s+([a-z]+(?:\s+[a-z]+){0,2})\s+is\s+(when|where|the\s+time|the\s+distance|the\s+period)[^.]+\.', 'DEF'),
    ]
    
    seen = set()
    for pattern, cat in patterns:
        for match in re.finditer(pattern, text):
            term = match.group(1).strip()
            definition = match.group(0).strip()
            
            # 过滤
            if len(term) < 3 or term.lower() in ['the', 'this', 'that', 'you', 'your', 'make', 'sure']:
                continue
            if len(definition) < 20:
                continue
            
            term_key = term.lower()
            if term_key in seen:
                continue
            seen.add(term_key)
            
            idx += 1
            definitions.append({
                "code": generate_code(chapter_code, cat, idx),
                "title": term.title()[:100],
                "description": definition[:1000],
                "type": "definition"
            })
    
    return definitions


def extract_rules(text: str, chapter_code: str) -> List[Dict]:
    """提取规则类知识点"""
    rules = []
    idx = 0
    
    patterns = [
        # 必须要求
        (r'You\s+must\s+([^.]+\.)', 'REQ', 'Requirement'),
        (r'Drivers?\s+must\s+([^.]+\.)', 'REQ', 'Driver requirement'),
        (r'[Aa]re\s+required\s+to\s+([^.]+\.)', 'REQ', 'Requirement'),
        
        # 禁止事项
        (r'You\s+must\s+not\s+([^.]+\.)', 'PROH', 'Prohibition'),
        (r'Never\s+([^.]+\.)', 'PROH', 'Never'),
        (r'Do\s+not\s+([^.]+\.)', 'PROH', 'Do not'),
        (r'[Ii]t\s+is\s+illegal\s+to\s+([^.]+\.)', 'PROH', 'Illegal'),
        
        # 最佳实践
        (r'Always\s+([^.]+\.)', 'BEST', 'Always'),
        (r'You\s+should\s+([^.]+\.)', 'REC', 'Recommendation'),
        
        # 数值规则
        (r'[Mm]aximum\s+(?:of\s+)?(\d+[^.]+\.)', 'LIMIT', 'Maximum'),
        (r'[Mm]inimum\s+(?:of\s+)?(\d+[^.]+\.)', 'LIMIT', 'Minimum'),
        (r'[Aa]t\s+least\s+(\d+[^.]+\.)', 'LIMIT', 'At least'),
        (r'[Nn]o\s+more\s+than\s+(\d+[^.]+\.)', 'LIMIT', 'No more than'),
        (r'[Ww]ithin\s+(\d+[^.]+\.)', 'LIMIT', 'Within'),
        
        # 时间/距离规则
        (r'(\d+\s*(?:hours?|minutes?|seconds?)[^.]+\.)', 'TIME', 'Time rule'),
        (r'(\d+\s*(?:metres?|meters?|feet|km|kilometres?)[^.]+\.)', 'DIST', 'Distance rule'),
        
        # 如果...则...
        (r'If\s+([^,]+),\s+you\s+(?:must|should|will)[^.]+\.', 'COND', 'Conditional rule'),
        
        # 警告
        (r'[Ww]arning[:\s]+([^.]+\.)', 'WARN', 'Warning'),
    ]
    
    seen = set()
    for pattern, cat, title_prefix in patterns:
        for match in re.finditer(pattern, text):
            full_match = match.group(0).strip()
            
            # 过滤太短的
            if len(full_match) < 25:
                continue
            
            # 去重
            key = full_match.lower()[:80]
            if key in seen:
                continue
            seen.add(key)
            
            # 生成标题
            content = match.group(1).strip() if match.lastindex >= 1 else full_match
            title = f"{title_prefix}: {content[:70]}"
            if len(title) > 100:
                title = title[:97] + "..."
            
            idx += 1
            rules.append({
                "code": generate_code(chapter_code, cat, idx),
                "title": title,
                "description": full_match[:1000],
                "type": "rule"
            })
    
    return rules


def extract_facts(text: str, chapter_code: str) -> List[Dict]:
    """提取事实/知识点"""
    facts = []
    idx = 0
    
    # 提取包含具体数字的事实
    patterns = [
        # 速度相关
        (r'[Ss]peed\s+limit\s+(?:is\s+)?(\d+\s*km/h[^.]*\.)', 'SPEED', 'Speed limit'),
        (r'(\d+\s*km/h[^.]*(?:speed|limit|zone)[^.]*\.)', 'SPEED', 'Speed'),
        
        # 压力相关 (air brakes)
        (r'(\d+\s*psi[^.]+\.)', 'PRESS', 'Air pressure'),
        (r'[Pp]ressure\s+(?:of\s+)?(\d+[^.]+\.)', 'PRESS', 'Pressure'),
        
        # 时间相关
        (r'(\d+\s*(?:consecutive\s+)?hours?\s+(?:of\s+)?(?:off[- ]duty|on[- ]duty|driving|rest)[^.]+\.)', 'HRS', 'Hours'),
        
        # 距离相关
        (r'[Ff]ollowing\s+distance\s+([^.]+\.)', 'DIST', 'Following distance'),
        (r'[Ss]topping\s+distance\s+([^.]+\.)', 'DIST', 'Stopping distance'),
        
        # 重量相关
        (r'(\d+\s*(?:kg|kilogram|pound|lb)[^.]+\.)', 'WEIGHT', 'Weight'),
        
        # 尺寸相关
        (r'(\d+\s*(?:mm|millimetre|inch|in)[^.]+(?:stroke|adjustment|clearance)[^.]*\.)', 'SIZE', 'Measurement'),
    ]
    
    seen = set()
    for pattern, cat, title_prefix in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            full_match = match.group(0).strip()
            
            if len(full_match) < 20:
                continue
            
            key = full_match.lower()[:80]
            if key in seen:
                continue
            seen.add(key)
            
            content = match.group(1).strip() if match.lastindex >= 1 else full_match
            title = f"{title_prefix}: {content[:70]}"
            if len(title) > 100:
                title = title[:97] + "..."
            
            idx += 1
            facts.append({
                "code": generate_code(chapter_code, cat, idx),
                "title": title,
                "description": full_match[:1000],
                "type": "fact"
            })
    
    return facts


def extract_components(text: str, chapter_code: str) -> List[Dict]:
    """提取组件/部件知识点（主要用于 Air Brakes 章节）"""
    components = []
    idx = 0
    
    # 常见的空气制动组件
    component_names = [
        "compressor", "governor", "reservoir", "foot valve", "brake chamber",
        "slack adjuster", "s-cam", "pushrod", "brake shoe", "brake drum",
        "relay valve", "quick release valve", "check valve", "air dryer",
        "spring brake", "parking brake", "service brake", "trailer brake",
        "tractor protection valve", "glad hands", "air tank", "pressure gauge",
        "low air warning", "safety valve", "drain valve"
    ]
    
    seen = set()
    for comp in component_names:
        # 查找关于该组件的描述
        pattern = rf'[Tt]he\s+{comp}\s+([^.]+\.)'
        for match in re.finditer(pattern, text, re.IGNORECASE):
            full_match = match.group(0).strip()
            
            if len(full_match) < 30:
                continue
            
            key = comp.lower()
            if key in seen:
                continue
            seen.add(key)
            
            idx += 1
            components.append({
                "code": generate_code(chapter_code, 'COMP', idx),
                "title": comp.title(),
                "description": full_match[:1000],
                "type": "component"
            })
    
    return components


def main():
    logger.info(f"打开 PDF: {PDF_PATH}")
    
    all_knowledge = []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        logger.info(f"PDF 共 {len(pdf.pages)} 页")
        
        for chapter in CHAPTERS:
            logger.info(f"处理 Chapter {chapter['num']}: {chapter['title']}")
            
            # 提取章节文本
            text = extract_chapter_text(pdf, chapter)
            chapter_code = chapter["code"]
            
            # 提取各类知识点
            definitions = extract_definitions(text, chapter_code)
            rules = extract_rules(text, chapter_code)
            facts = extract_facts(text, chapter_code)
            components = extract_components(text, chapter_code)
            
            # 添加章节信息
            for kp in definitions + rules + facts + components:
                kp["chapter"] = chapter["num"]
                kp["importance"] = "high"
            
            chapter_total = len(definitions) + len(rules) + len(facts) + len(components)
            logger.info(f"  - 定义: {len(definitions)}, 规则: {len(rules)}, 事实: {len(facts)}, 组件: {len(components)}, 总计: {chapter_total}")
            
            all_knowledge.extend(definitions)
            all_knowledge.extend(rules)
            all_knowledge.extend(facts)
            all_knowledge.extend(components)
    
    # 去重
    seen_desc = set()
    unique_knowledge = []
    for kp in all_knowledge:
        key = kp["description"].lower()[:100]
        if key not in seen_desc:
            seen_desc.add(key)
            unique_knowledge.append(kp)
    
    # 重新编号
    for i, kp in enumerate(unique_knowledge):
        old_code = kp["code"]
        parts = old_code.split(".")
        if len(parts) >= 2:
            kp["code"] = f"{parts[0]}.{parts[1]}.{i+1:03d}"
    
    # 保存
    output_file = Path("/home/ericl/source_code/workspace_fullstack/LingAdmin/admin/icbc_knowledge_auto.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_knowledge, f, ensure_ascii=False, indent=2)
    
    # 统计
    print("\n" + "=" * 60)
    print("提取结果")
    print("=" * 60)
    print(f"总知识点数: {len(unique_knowledge)}")
    print(f"  - 定义类: {len([k for k in unique_knowledge if k['type'] == 'definition'])}")
    print(f"  - 规则类: {len([k for k in unique_knowledge if k['type'] == 'rule'])}")
    print(f"  - 事实类: {len([k for k in unique_knowledge if k['type'] == 'fact'])}")
    print(f"  - 组件类: {len([k for k in unique_knowledge if k['type'] == 'component'])}")
    print(f"\n已保存到: {output_file}")
    print("=" * 60)
    
    # 显示样本
    print("\n=== 样本 ===")
    for kp in unique_knowledge[:10]:
        print(f"Code: {kp['code']}")
        print(f"Title: {kp['title']}")
        print(f"Desc: {kp['description'][:80]}...")
        print("-" * 40)


if __name__ == "__main__":
    main()
