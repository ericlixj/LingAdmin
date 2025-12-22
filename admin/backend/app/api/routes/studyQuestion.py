from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.studyQuestion_crud import StudyQuestionCRUD
from app.models.studyQuestion import StudyQuestion, StudyQuestionCreate, StudyQuestionListResponse, StudyQuestionUpdate
from app.models.studyQuestionKnowledge import StudyQuestionKnowledge
from app.models.studyKnowledgeNode import StudyKnowledgeNode
from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
from app.models.studySourceSection import StudySourceSection
from app.models.studySource import StudySource
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from sqlmodel import Session, select
from datetime import datetime
from app.core.utils import parse_refine_filters
from pydantic import BaseModel

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()


class KnowledgeLinkItem(BaseModel):
    """单个知识点关联"""
    knowledge_node_id: int
    weight: int = 50  # 默认权重 50


class KnowledgeLinkRequest(BaseModel):
    """更新题目关联知识点的请求（支持权重）"""
    # 兼容旧格式：只有 ID 列表
    knowledge_node_ids: Optional[List[int]] = None
    # 新格式：带权重的关联列表
    links: Optional[List[KnowledgeLinkItem]] = None

@router.post("", dependencies=[Depends(has_permission("studyQuestion:create"))], response_model=StudyQuestion)
def create_item(
    item_in: StudyQuestionCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating StudyQuestion with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating StudyQuestion with current_user_id: {current_user_id}")
    crud = StudyQuestionCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("studyQuestion:list"))], response_model=StudyQuestionListResponse)
def list_items(
    request: Request,
    _start: int = Query(0),
    _end: int = Query(10),
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    query_params = dict(request.query_params)
    filters = parse_refine_filters(query_params)

    crud = StudyQuestionCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(StudyQuestion, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("studyQuestion:show"))], response_model=StudyQuestion)
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyQuestionCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="StudyQuestion not found")
    return item

@router.patch("/{item_id}", dependencies=[Depends(has_permission("studyQuestion:edit"))], response_model=StudyQuestion)
def update_item(
    item_id: int,
    item_in: StudyQuestionUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyQuestionCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyQuestion not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("studyQuestion:delete"))], response_model=StudyQuestion)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyQuestionCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyQuestion not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)


@router.get("/{item_id}/knowledge", dependencies=[Depends(has_permission("studyQuestion:show"))])
def get_question_knowledge(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    """获取题目关联的知识点列表（包含来源章节信息）"""
    # 获取关联记录
    links = session.exec(
        select(StudyQuestionKnowledge).where(
            StudyQuestionKnowledge.question_id == item_id,
            StudyQuestionKnowledge.deleted == False
        )
    ).all()
    
    if not links:
        return {"knowledge_nodes": [], "links": []}
    
    # 获取知识点详情
    knowledge_ids = [link.knowledge_node_id for link in links]
    knowledge_nodes = session.exec(
        select(StudyKnowledgeNode).where(
            StudyKnowledgeNode.id.in_(knowledge_ids),
            StudyKnowledgeNode.deleted == False
        )
    ).all()
    
    # 获取所有知识点的来源章节关联
    kn_source_links = session.exec(
        select(StudyKnowledgeSourceSection).where(
            StudyKnowledgeSourceSection.knowledge_node_id.in_(knowledge_ids),
            StudyKnowledgeSourceSection.deleted == False
        )
    ).all()
    
    # 获取所有章节信息
    section_ids = list(set(link.source_section_id for link in kn_source_links if link.source_section_id))
    sections_map = {}
    if section_ids:
        sections = session.exec(
            select(StudySourceSection).where(
                StudySourceSection.id.in_(section_ids),
                StudySourceSection.deleted == False
            )
        ).all()
        sections_map = {s.id: s for s in sections}
    
    # 获取所有来源（教材）信息
    source_ids = list(set(s.source_id for s in sections_map.values() if s.source_id))
    sources_map = {}
    if source_ids:
        sources = session.exec(
            select(StudySource).where(
                StudySource.id.in_(source_ids),
                StudySource.deleted == False
            )
        ).all()
        sources_map = {s.id: s for s in sources}
    
    # 构建知识点到来源章节的映射
    kn_sources_map = {}
    for kn_link in kn_source_links:
        kn_id = kn_link.knowledge_node_id
        section = sections_map.get(kn_link.source_section_id)
        if section:
            if kn_id not in kn_sources_map:
                kn_sources_map[kn_id] = []
            source = sources_map.get(section.source_id) if section.source_id else None
            kn_sources_map[kn_id].append({
                "section_id": section.id,
                "chapter": section.chapter,
                "section": section.section,
                "page_start": section.page_start,
                "page_end": section.page_end,
                "anchor_text": section.anchor_text,  # 原文摘要
                "source": {
                    "id": source.id,
                    "type": source.type,
                    "title": source.title,
                    "version": source.version,
                    "description": source.description if hasattr(source, 'description') else None,
                    "publisher": source.publisher if hasattr(source, 'publisher') else None,
                } if source else None
            })
    
    # 构建响应
    return {
        "knowledge_nodes": [
            {
                "id": kn.id,
                "code": kn.code,
                "title": kn.title,
                "description": kn.description,  # 知识点描述
                "importance": kn.importance,
                "sources": kn_sources_map.get(kn.id, []),
            }
            for kn in knowledge_nodes
        ],
        "links": [
            {
                "id": link.id,
                "knowledge_node_id": link.knowledge_node_id,
                "weight": link.weight,
            }
            for link in links
        ]
    }


@router.put("/{item_id}/knowledge", dependencies=[Depends(has_permission("studyQuestion:edit"))])
def update_question_knowledge(
    item_id: int,
    request: KnowledgeLinkRequest,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    """更新题目关联的知识点（全量更新，支持权重）"""
    # 验证题目存在
    question = session.exec(
        select(StudyQuestion).where(StudyQuestion.id == item_id)
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="StudyQuestion not found")
    
    # 解析请求：支持两种格式
    # 新格式：links = [{knowledge_node_id, weight}, ...]
    # 旧格式：knowledge_node_ids = [id1, id2, ...]
    if request.links is not None:
        # 新格式：带权重
        new_links_map = {item.knowledge_node_id: item.weight for item in request.links}
        new_ids = set(new_links_map.keys())
    elif request.knowledge_node_ids is not None:
        # 旧格式：默认权重 50
        new_links_map = {kn_id: 50 for kn_id in request.knowledge_node_ids}
        new_ids = set(request.knowledge_node_ids)
    else:
        new_links_map = {}
        new_ids = set()
    
    # 获取现有关联
    existing_links = session.exec(
        select(StudyQuestionKnowledge).where(
            StudyQuestionKnowledge.question_id == item_id,
            StudyQuestionKnowledge.deleted == False
        )
    ).all()
    existing_map = {link.knowledge_node_id: link for link in existing_links}
    existing_ids = set(existing_map.keys())
    
    # 需要删除的关联
    to_delete = existing_ids - new_ids
    # 需要新增的关联
    to_add = new_ids - existing_ids
    # 需要更新权重的关联
    to_update = existing_ids & new_ids
    
    # 软删除不再需要的关联
    for kn_id in to_delete:
        link = existing_map[kn_id]
        link.deleted = True
        link.updater = str(current_user_id)
        session.add(link)
    
    # 更新现有关联的权重
    for kn_id in to_update:
        link = existing_map[kn_id]
        new_weight = new_links_map.get(kn_id, 50)
        if link.weight != new_weight:
            link.weight = new_weight
            link.updater = str(current_user_id)
            session.add(link)
    
    # 添加新关联
    for kn_id in to_add:
        # 验证知识点存在
        kn = session.exec(
            select(StudyKnowledgeNode).where(StudyKnowledgeNode.id == kn_id)
        ).first()
        if kn:
            new_link = StudyQuestionKnowledge(
                question_id=item_id,
                knowledge_node_id=kn_id,
                weight=new_links_map.get(kn_id, 50),
                creator=str(current_user_id),
                deleted=False
            )
            session.add(new_link)
    
    session.commit()
    
    # 返回更新后的关联
    return get_question_knowledge(item_id, session, current_user_id)