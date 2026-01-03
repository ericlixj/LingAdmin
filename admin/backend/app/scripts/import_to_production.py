#!/usr/bin/env python3
"""
生产环境数据导入脚本

功能：
1. 导入章节数据（source_id=2，12条）
2. 导入知识点数据（177条items）
3. 导入题目数据（exam_id=4）
4. 重新建立题目与知识点的关联

注意：此脚本使用业务字段匹配，不依赖ID，避免ID冲突
"""

import sys
import json
import logging
from typing import Dict, Optional
from sqlmodel import Session, select

from app.core.db import engine
from app.core.config import settings
from app.models.studySourceSection import StudySourceSection, StudySourceSectionCreate
from app.models.studyKnowledgeNode import StudyKnowledgeNode, StudyKnowledgeNodeCreate
from app.models.studyQuestion import StudyQuestion, StudyQuestionCreate
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge, StudyQuestionKnowledgeCreate
from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection, StudyKnowledgeSourceSectionCreate

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置参数
SOURCE_ID_TEST = 730  # 测试环境的 source_id
SOURCE_ID_PROD = 2    # 生产环境的 source_id
EXAM_ID_TEST = 6      # 测试环境的 exam_id
EXAM_ID_PROD = 4      # 生产环境的 exam_id
CREATOR = "system"    # 创建人


def extract_item_name_from_stem(stem: str) -> Optional[str]:
    """从题干中提取知识点名称"""
    if "describes " in stem:
        try:
            item_name = stem.split("describes ")[1].split("?")[0].strip()
            return item_name
        except:
            pass
    return None


def import_sections(session: Session) -> Dict[int, int]:
    """
    导入章节数据
    返回：{测试环境section_id: 生产环境section_id} 的映射
    """
    logger.info("=" * 80)
    logger.info("步骤 1: 导入章节数据")
    logger.info("=" * 80)
    
    # 从测试环境读取章节数据
    test_sections = session.exec(
        select(StudySourceSection)
        .where(
            StudySourceSection.source_id == SOURCE_ID_TEST,
            StudySourceSection.deleted == False
        )
        .order_by(StudySourceSection.id)
    ).all()
    
    logger.info(f"从测试环境读取到 {len(test_sections)} 条章节数据")
    
    section_id_map: Dict[int, int] = {}
    created_count = 0
    existing_count = 0
    
    for test_section in test_sections:
        # 检查生产环境是否已存在（根据 source_id + chapter + section 匹配）
        existing_section = session.exec(
            select(StudySourceSection)
            .where(
                StudySourceSection.source_id == SOURCE_ID_PROD,
                StudySourceSection.chapter == test_section.chapter,
                StudySourceSection.section == test_section.section,
                StudySourceSection.deleted == False
            )
        ).first()
        
        if existing_section:
            # 已存在，使用现有ID
            section_id_map[test_section.id] = existing_section.id
            existing_count += 1
            logger.info(f"  章节已存在: {test_section.chapter} / {test_section.section} (ID: {existing_section.id})")
        else:
            # 创建新章节
            new_section = StudySourceSection(
                source_id=SOURCE_ID_PROD,
                chapter=test_section.chapter,
                section=test_section.section,
                page_start=test_section.page_start,
                page_end=test_section.page_end,
                anchor_text=test_section.anchor_text,
                creator=CREATOR,
                dept_id=0
            )
            session.add(new_section)
            session.flush()  # 获取新ID
            section_id_map[test_section.id] = new_section.id
            created_count += 1
            logger.info(f"  创建章节: {test_section.chapter} / {test_section.section} (ID: {new_section.id})")
    
    session.commit()
    logger.info(f"章节导入完成: 创建 {created_count} 条，已存在 {existing_count} 条")
    
    return section_id_map


def import_knowledge_nodes(session: Session, section_id_map: Dict[int, int]) -> Dict[int, int]:
    """
    导入知识点数据
    返回：{测试环境knowledge_node_id: 生产环境knowledge_node_id} 的映射
    """
    logger.info("=" * 80)
    logger.info("步骤 2: 导入知识点数据")
    logger.info("=" * 80)
    
    # 从测试环境读取知识点数据
    test_items = session.exec(
        select(StudyKnowledgeNode)
        .where(
            StudyKnowledgeNode.exam_id == EXAM_ID_TEST,
            StudyKnowledgeNode.deleted == False
        )
        .order_by(StudyKnowledgeNode.id)
    ).all()
    
    logger.info(f"从测试环境读取到 {len(test_items)} 条知识点数据")
    
    # 读取知识点与章节的关联（测试环境）
    from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
    test_links = session.exec(
        select(StudyKnowledgeSourceSection)
        .where(StudyKnowledgeSourceSection.deleted == False)
    ).all()
    
    # 构建知识点ID到章节ID的映射（测试环境）
    test_item_to_section: Dict[int, int] = {}
    for link in test_links:
        if link.knowledge_node_id and link.source_section_id:
            test_item_to_section[link.knowledge_node_id] = link.source_section_id
    
    knowledge_id_map: Dict[int, int] = {}
    created_count = 0
    existing_count = 0
    
    for test_item in test_items:
        # 获取对应的章节ID（生产环境）
        test_section_id = test_item_to_section.get(test_item.id)
        if not test_section_id:
            logger.warning(f"  知识点 {test_item.title} (ID: {test_item.id}) 没有关联章节，跳过")
            continue
        
        prod_section_id = section_id_map.get(test_section_id)
        if not prod_section_id:
            logger.warning(f"  知识点 {test_item.title} (ID: {test_item.id}) 的章节映射不存在，跳过")
            continue
        
        # 检查生产环境是否已存在（根据 title 匹配，不限制章节）
        existing_item = session.exec(
            select(StudyKnowledgeNode)
            .where(
                StudyKnowledgeNode.title == test_item.title,
                StudyKnowledgeNode.deleted == False
            )
        ).first()
        
        if existing_item:
            # 已存在，使用现有ID
            knowledge_id_map[test_item.id] = existing_item.id
            existing_count += 1
            logger.info(f"  知识点已存在: {test_item.title} (ID: {existing_item.id})")
        else:
            # 创建新知识点
            # 生成 code（使用 title 的简化版本）
            code = test_item.code if test_item.code else f"item_{test_item.title.lower().replace(' ', '_')[:50]}"
            
            new_item = StudyKnowledgeNode(
                exam_id=None,  # 生产环境知识点不关联 exam
                code=code,
                title=test_item.title,
                description=test_item.description,
                importance=test_item.importance,
                image_url=test_item.image_url,
                creator=CREATOR,
                dept_id=0
            )
            session.add(new_item)
            session.flush()  # 获取新ID
            
            # 创建知识点与章节的关联
            link = StudyKnowledgeSourceSection(
                knowledge_node_id=new_item.id,
                source_section_id=prod_section_id,
                creator=CREATOR,
                dept_id=0
            )
            session.add(link)
            
            knowledge_id_map[test_item.id] = new_item.id
            created_count += 1
            logger.info(f"  创建知识点: {test_item.title} (ID: {new_item.id})")
    
    session.commit()
    logger.info(f"知识点导入完成: 创建 {created_count} 条，已存在 {existing_count} 条")
    
    return knowledge_id_map


def import_questions(session: Session) -> Dict[int, int]:
    """
    导入题目数据
    返回：{测试环境question_id: 生产环境question_id} 的映射
    """
    logger.info("=" * 80)
    logger.info("步骤 3: 导入题目数据")
    logger.info("=" * 80)
    
    # 从测试环境读取题目数据
    test_questions = session.exec(
        select(StudyQuestion)
        .where(
            StudyQuestion.exam_id == EXAM_ID_TEST,
            StudyQuestion.deleted == False
        )
        .order_by(StudyQuestion.id)
    ).all()
    
    logger.info(f"从测试环境读取到 {len(test_questions)} 条题目数据")
    
    question_id_map: Dict[int, int] = {}
    created_count = 0
    existing_count = 0
    
    for test_question in test_questions:
        # 检查生产环境是否已存在（根据 exam_id + stem 匹配）
        existing_question = session.exec(
            select(StudyQuestion)
            .where(
                StudyQuestion.exam_id == EXAM_ID_PROD,
                StudyQuestion.stem == test_question.stem,
                StudyQuestion.deleted == False
            )
        ).first()
        
        if existing_question:
            # 已存在，使用现有ID（用户要求直接使用当前环境数据，已存在则跳过）
            question_id_map[test_question.id] = existing_question.id
            existing_count += 1
            logger.info(f"  题目已存在: {test_question.stem[:50]}... (ID: {existing_question.id})")
        else:
            # 创建新题目
            new_question = StudyQuestion(
                exam_id=EXAM_ID_PROD,
                type=test_question.type,
                stem=test_question.stem,
                options=test_question.options,
                answer=test_question.answer,
                explanation_raw=test_question.explanation_raw,
                explanation_human=test_question.explanation_human,
                image_url=test_question.image_url,
                status=test_question.status if test_question.status is not None else 0,
                creator=CREATOR,
                dept_id=0
            )
            session.add(new_question)
            session.flush()  # 获取新ID
            
            question_id_map[test_question.id] = new_question.id
            created_count += 1
            logger.info(f"  创建题目: {test_question.stem[:50]}... (ID: {new_question.id})")
    
    session.commit()
    logger.info(f"题目导入完成: 创建 {created_count} 条，已存在 {existing_count} 条")
    
    return question_id_map


def import_question_knowledge_links(
    session: Session,
    question_id_map: Dict[int, int],
    knowledge_id_map: Dict[int, int]
):
    """
    重新建立题目与知识点的关联
    """
    logger.info("=" * 80)
    logger.info("步骤 4: 建立题目与知识点的关联")
    logger.info("=" * 80)
    
    # 从测试环境读取题目数据
    test_questions = session.exec(
        select(StudyQuestion)
        .where(
            StudyQuestion.exam_id == EXAM_ID_TEST,
            StudyQuestion.deleted == False
        )
    ).all()
    
    # 构建知识点名称到ID的映射（生产环境）
    prod_knowledge_by_title: Dict[str, int] = {}
    prod_knowledge_nodes = session.exec(
        select(StudyKnowledgeNode)
        .where(StudyKnowledgeNode.deleted == False)
    ).all()
    for node in prod_knowledge_nodes:
        prod_knowledge_by_title[node.title] = node.id
    
    created_count = 0
    skipped_count = 0
    
    for test_question in test_questions:
        prod_question_id = question_id_map.get(test_question.id)
        if not prod_question_id:
            logger.warning(f"  题目 ID {test_question.id} 没有映射，跳过")
            skipped_count += 1
            continue
        
        # 从题干中提取知识点名称
        item_name = extract_item_name_from_stem(test_question.stem)
        if not item_name:
            logger.warning(f"  题目 ID {prod_question_id} 无法提取知识点名称，跳过")
            skipped_count += 1
            continue
        
        # 查找对应的知识点（生产环境）
        prod_knowledge_id = prod_knowledge_by_title.get(item_name)
        if not prod_knowledge_id:
            logger.warning(f"  知识点 '{item_name}' 在生产环境不存在，跳过")
            skipped_count += 1
            continue
        
        # 检查关联是否已存在
        existing_link = session.exec(
            select(StudyQuestionKnowledge)
            .where(
                StudyQuestionKnowledge.question_id == prod_question_id,
                StudyQuestionKnowledge.knowledge_node_id == prod_knowledge_id,
                StudyQuestionKnowledge.deleted == False
            )
        ).first()
        
        if existing_link:
            logger.info(f"  关联已存在: question_id={prod_question_id} <-> knowledge_node_id={prod_knowledge_id}")
            continue
        
        # 创建新关联
        new_link = StudyQuestionKnowledge(
            question_id=prod_question_id,
            knowledge_node_id=prod_knowledge_id,
            weight=100,  # 默认权重
            creator=CREATOR,
            dept_id=0
        )
        session.add(new_link)
        created_count += 1
        logger.info(f"  创建关联: question_id={prod_question_id} <-> knowledge_node_id={prod_knowledge_id} ({item_name})")
    
    session.commit()
    logger.info(f"关联建立完成: 创建 {created_count} 条，跳过 {skipped_count} 条")


def main():
    """主函数"""
    logger.info("=" * 80)
    logger.info("开始生产环境数据导入")
    logger.info("=" * 80)
    logger.info(f"测试环境: source_id={SOURCE_ID_TEST}, exam_id={EXAM_ID_TEST}")
    logger.info(f"生产环境: source_id={SOURCE_ID_PROD}, exam_id={EXAM_ID_PROD}")
    logger.info("")
    
    try:
        with Session(engine) as session:
            # 步骤 1: 导入章节
            section_id_map = import_sections(session)
            logger.info("")
            
            # 步骤 2: 导入知识点
            knowledge_id_map = import_knowledge_nodes(session, section_id_map)
            logger.info("")
            
            # 步骤 3: 导入题目
            question_id_map = import_questions(session)
            logger.info("")
            
            # 步骤 4: 建立关联
            import_question_knowledge_links(session, question_id_map, knowledge_id_map)
            logger.info("")
        
        logger.info("=" * 80)
        logger.info("✅ 生产环境数据导入完成！")
        logger.info("=" * 80)
        
    except Exception as e:
        logger.error(f"❌ 导入过程中发生错误: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
