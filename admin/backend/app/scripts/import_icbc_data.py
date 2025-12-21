"""
ICBC Class 4 驾照教材数据导入脚本

根据分析结果，将章节、知识点导入数据库

已有数据:
- exam: id=1, code=ICBC_Driving_commercial_vehicles_class4
- source: id=1, type=pdf, title=Driving commercial vehicles, version=082024

使用方法:
    cd admin/backend
    uv run python -m app.scripts.import_icbc_data
"""
import json
import sys
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 硬编码的章节数据（基于 PDF 分析结果）
CHAPTERS = [
    {"chapter": "Chapter 1", "title": "Getting your driver's licence", "page_start": 22, "page_end": 33},
    {"chapter": "Chapter 2", "title": "Heavy vehicle braking", "page_start": 34, "page_end": 44},
    {"chapter": "Chapter 3", "title": "Basic driving skills", "page_start": 45, "page_end": 83},
    {"chapter": "Chapter 4", "title": "Fuel-efficient driving", "page_start": 84, "page_end": 91},
    {"chapter": "Chapter 5", "title": "Skills for driving trucks and trailers", "page_start": 92, "page_end": 133},
    {"chapter": "Chapter 6", "title": "Skills for driving buses, taxis, limousines and ride-hailing vehicles", "page_start": 134, "page_end": 147},
    {"chapter": "Chapter 7", "title": "Hours of service requirements", "page_start": 148, "page_end": 157},
    {"chapter": "Chapter 8", "title": "Air brakes", "page_start": 158, "page_end": 200},
    {"chapter": "Chapter 9", "title": "Air brake adjustment", "page_start": 201, "page_end": 210},
    {"chapter": "Chapter 10", "title": "Vehicle and air brake pre-trip inspections", "page_start": 211, "page_end": 248},
    {"chapter": "Chapter 11", "title": "Signs, signals and road markings", "page_start": 249, "page_end": 261},
    {"chapter": "Chapter 12", "title": "Industrial roads", "page_start": 262, "page_end": 266},
    {"chapter": "Chapter 13", "title": "For more information", "page_start": 267, "page_end": 281},
]

# 配置
EXAM_ID = 1
SOURCE_ID = 1
CREATOR = "system"


def import_chapters():
    """导入章节数据到 StudySourceSection"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studySourceSection import StudySourceSection
    
    with Session(engine) as session:
        # 检查是否已有数据
        existing = session.exec(
            select(StudySourceSection).where(StudySourceSection.source_id == SOURCE_ID)
        ).all()
        
        if existing:
            logger.warning(f"Source {SOURCE_ID} 已有 {len(existing)} 个章节记录")
            response = input("是否删除并重新导入? (y/n): ")
            if response.lower() != 'y':
                logger.info("跳过章节导入")
                return {}
            
            # 删除现有记录
            for item in existing:
                session.delete(item)
            session.commit()
            logger.info(f"已删除 {len(existing)} 条现有记录")
        
        # 导入新数据
        section_map = {}
        for chapter in CHAPTERS:
            # 截断过长字段以适应数据库限制
            chapter_name = chapter["chapter"][:64]
            section_title = chapter["title"][:255]  # 扩展到255
            anchor = f"{chapter['chapter']}: {chapter['title']}"[:1024]
            
            section = StudySourceSection(
                source_id=SOURCE_ID,
                chapter=chapter_name,
                section=section_title,
                page_start=chapter["page_start"],
                page_end=chapter["page_end"],
                anchor_text=anchor,
                creator=CREATOR,
                deleted=False
            )
            session.add(section)
            session.flush()
            section_map[chapter["chapter"]] = section.id
            logger.info(f"创建章节: {section.chapter} - {section.section} (ID: {section.id})")
        
        session.commit()
        logger.info(f"成功导入 {len(CHAPTERS)} 个章节")
        return section_map


def import_knowledge_points_from_analysis(analysis_file: str, section_map: dict):
    """从分析文件导入知识点"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
    
    # 读取分析文件
    with open(analysis_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    knowledge_points = data.get("knowledge_points", [])
    logger.info(f"从分析文件读取到 {len(knowledge_points)} 个知识点")
    
    # 只导入高重要性的知识点
    high_importance_kps = [kp for kp in knowledge_points if kp.get("importance") == "high"]
    logger.info(f"其中高重要性知识点: {len(high_importance_kps)} 个")
    
    with Session(engine) as session:
        # 检查是否已有数据
        existing = session.exec(
            select(StudyKnowledgeNode).where(StudyKnowledgeNode.exam_id == EXAM_ID)
        ).all()
        
        if existing:
            logger.warning(f"Exam {EXAM_ID} 已有 {len(existing)} 个知识点记录")
            response = input("是否删除并重新导入? (y/n): ")
            if response.lower() != 'y':
                logger.info("跳过知识点导入")
                return
            
            # 删除现有记录及映射
            from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
            for item in existing:
                # 删除映射
                mappings = session.exec(
                    select(StudyKnowledgeSourceSection).where(
                        StudyKnowledgeSourceSection.knowledge_node_id == item.id
                    )
                ).all()
                for m in mappings:
                    session.delete(m)
                session.delete(item)
            session.commit()
            logger.info(f"已删除 {len(existing)} 条现有知识点记录")
        
        # 导入知识点
        kp_count = 0
        for idx, kp in enumerate(high_importance_kps):
            code = f"ICBC_C4_KP_{idx + 1:04d}"
            
            # 根据页码确定所属章节
            page = kp.get("page", 0)
            chapter_name = None
            for chapter in CHAPTERS:
                if chapter["page_start"] <= page <= chapter["page_end"]:
                    chapter_name = chapter["chapter"]
                    break
            
            knowledge_node = StudyKnowledgeNode(
                exam_id=EXAM_ID,
                code=code,
                title=kp.get("title", "")[:255],
                description=kp.get("description", "")[:9999],
                importance=kp.get("importance", "medium"),
                creator=CREATOR,
                deleted=False
            )
            session.add(knowledge_node)
            session.flush()
            
            # 创建知识点与章节映射
            if chapter_name and chapter_name in section_map:
                mapping = StudyKnowledgeSourceSection(
                    knowledge_node_id=knowledge_node.id,
                    source_section_id=section_map[chapter_name],
                    creator=CREATOR,
                    deleted=False
                )
                session.add(mapping)
            
            kp_count += 1
            if kp_count % 50 == 0:
                logger.info(f"已处理 {kp_count} 个知识点...")
        
        session.commit()
        logger.info(f"成功导入 {kp_count} 个知识点")


def show_summary():
    """显示数据摘要"""
    from sqlmodel import Session, select, func
    from app.core.db import engine
    from app.models.studySourceSection import StudySourceSection
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
    
    with Session(engine) as session:
        section_count = session.exec(
            select(func.count()).select_from(StudySourceSection).where(
                StudySourceSection.source_id == SOURCE_ID,
                StudySourceSection.deleted == False
            )
        ).one()
        
        kp_count = session.exec(
            select(func.count()).select_from(StudyKnowledgeNode).where(
                StudyKnowledgeNode.exam_id == EXAM_ID,
                StudyKnowledgeNode.deleted == False
            )
        ).one()
        
        mapping_count = session.exec(
            select(func.count()).select_from(StudyKnowledgeSourceSection).where(
                StudyKnowledgeSourceSection.deleted == False
            )
        ).one()
        
        print("\n" + "=" * 60)
        print("数据摘要")
        print("=" * 60)
        print(f"Source ID: {SOURCE_ID}")
        print(f"Exam ID: {EXAM_ID}")
        print(f"章节 (StudySourceSection): {section_count}")
        print(f"知识点 (StudyKnowledgeNode): {kp_count}")
        print(f"知识点-章节映射 (StudyKnowledgeSourceSection): {mapping_count}")
        print("=" * 60)


def main():
    import argparse
    parser = argparse.ArgumentParser(description="ICBC Class 4 数据导入脚本")
    parser.add_argument("--chapters-only", action="store_true", help="只导入章节")
    parser.add_argument("--analysis-file", help="知识点分析文件路径")
    parser.add_argument("--summary", action="store_true", help="只显示数据摘要")
    
    args = parser.parse_args()
    
    if args.summary:
        show_summary()
        return
    
    # 导入章节
    logger.info("开始导入章节...")
    section_map = import_chapters()
    
    if args.chapters_only:
        logger.info("只导入章节，完成")
        show_summary()
        return
    
    # 导入知识点
    if args.analysis_file:
        if not Path(args.analysis_file).exists():
            logger.error(f"分析文件不存在: {args.analysis_file}")
            sys.exit(1)
        
        logger.info("开始导入知识点...")
        import_knowledge_points_from_analysis(args.analysis_file, section_map)
    
    show_summary()


if __name__ == "__main__":
    main()
