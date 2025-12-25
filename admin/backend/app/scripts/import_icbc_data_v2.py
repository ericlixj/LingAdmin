"""
ICBC Class 4 数据导入脚本 v2

导入:
1. 章节数据 (从 icbc_sections.json)
2. 知识点数据 (从 icbc_knowledge_points.json)

使用方法:
    cd admin/backend
    uv run python -m app.scripts.import_icbc_data_v2 --sections-file ../icbc_sections.json --knowledge-file ../icbc_knowledge_points.json
"""
import argparse
import json
import sys
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 配置
EXAM_ID = 1
SOURCE_ID = 1
CREATOR = "system"


def import_sections(sections_file: str):
    """导入章节数据"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studySourceSection import StudySourceSection
    
    with open(sections_file, 'r', encoding='utf-8') as f:
        sections = json.load(f)
    
    logger.info(f"读取到 {len(sections)} 个章节/段落")
    
    with Session(engine) as session:
        # 检查是否已有数据
        existing = session.exec(
            select(StudySourceSection).where(StudySourceSection.source_id == SOURCE_ID)
        ).all()
        
        if existing:
            logger.warning(f"Source {SOURCE_ID} 已有 {len(existing)} 条记录")
            response = input("是否删除并重新导入? (y/n): ")
            if response.lower() != 'y':
                logger.info("跳过章节导入")
                return {}
            
            for item in existing:
                session.delete(item)
            session.commit()
            logger.info(f"已删除 {len(existing)} 条记录")
        
        section_map = {}
        for s in sections:
            section = StudySourceSection(
                source_id=SOURCE_ID,
                chapter=s["chapter"][:64],
                section=s["section"][:255],
                page_start=s.get("page_start"),
                page_end=s.get("page_end"),
                anchor_text=s.get("content", "")[:1024],
                creator=CREATOR,
                deleted=False
            )
            session.add(section)
            session.flush()
            section_map[f"{s['chapter']}_{s['section'][:50]}"] = section.id
        
        session.commit()
        logger.info(f"成功导入 {len(sections)} 个章节/段落")
        return section_map


def import_knowledge_points(knowledge_file: str, section_map: dict):
    """导入知识点数据"""
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models.studyKnowledgeNode import StudyKnowledgeNode
    from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
    
    with open(knowledge_file, 'r', encoding='utf-8') as f:
        knowledge_points = json.load(f)
    
    logger.info(f"读取到 {len(knowledge_points)} 个知识点")
    
    with Session(engine) as session:
        # 检查是否已有数据
        existing = session.exec(
            select(StudyKnowledgeNode).where(StudyKnowledgeNode.exam_id == EXAM_ID)
        ).all()
        
        if existing:
            logger.warning(f"Exam {EXAM_ID} 已有 {len(existing)} 条记录")
            response = input("是否删除并重新导入? (y/n): ")
            if response.lower() != 'y':
                logger.info("跳过知识点导入")
                return
            
            # 删除映射和知识点
            for item in existing:
                mappings = session.exec(
                    select(StudyKnowledgeSourceSection).where(
                        StudyKnowledgeSourceSection.knowledge_node_id == item.id
                    )
                ).all()
                for m in mappings:
                    session.delete(m)
                session.delete(item)
            session.commit()
            logger.info(f"已删除 {len(existing)} 条记录")
        
        # 导入知识点
        for idx, kp in enumerate(knowledge_points):
            code = kp.get("code", f"KP_{idx:04d}")[:64]
            
            # 确保 code 唯一
            existing_code = session.exec(
                select(StudyKnowledgeNode).where(StudyKnowledgeNode.code == code)
            ).first()
            if existing_code:
                code = f"{code}_{idx}"[:64]
            
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
            
            # 创建章节映射（基于 chapter 字段）
            chapter_num = kp.get("chapter")
            if chapter_num:
                chapter_key = f"Chapter {chapter_num}_"
                for key, section_id in section_map.items():
                    if key.startswith(chapter_key):
                        mapping = StudyKnowledgeSourceSection(
                            knowledge_node_id=knowledge_node.id,
                            source_section_id=section_id,
                            creator=CREATOR,
                            deleted=False
                        )
                        session.add(mapping)
                        break
            
            if (idx + 1) % 100 == 0:
                logger.info(f"已处理 {idx + 1} 个知识点...")
        
        session.commit()
        logger.info(f"成功导入 {len(knowledge_points)} 个知识点")


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
        print(f"Exam ID: {EXAM_ID}")
        print(f"Source ID: {SOURCE_ID}")
        print(f"章节/段落 (StudySourceSection): {section_count}")
        print(f"知识点 (StudyKnowledgeNode): {kp_count}")
        print(f"知识点-章节映射 (StudyKnowledgeSourceSection): {mapping_count}")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="ICBC Class 4 数据导入脚本 v2")
    parser.add_argument("--sections-file", help="章节 JSON 文件路径")
    parser.add_argument("--knowledge-file", help="知识点 JSON 文件路径")
    parser.add_argument("--summary", action="store_true", help="只显示数据摘要")
    
    args = parser.parse_args()
    
    if args.summary:
        show_summary()
        return
    
    section_map = {}
    
    if args.sections_file:
        if not Path(args.sections_file).exists():
            logger.error(f"章节文件不存在: {args.sections_file}")
            sys.exit(1)
        logger.info("导入章节...")
        section_map = import_sections(args.sections_file)
    
    if args.knowledge_file:
        if not Path(args.knowledge_file).exists():
            logger.error(f"知识点文件不存在: {args.knowledge_file}")
            sys.exit(1)
        logger.info("导入知识点...")
        import_knowledge_points(args.knowledge_file, section_map)
    
    show_summary()


if __name__ == "__main__":
    main()


