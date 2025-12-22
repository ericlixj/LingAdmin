from typing import List, Optional, Dict, Any

from app.core.db import get_session
from app.core.deps import get_current_user_id, has_permission, get_current_dept_id
from app.crud.studyKnowledgeNode_crud import StudyKnowledgeNodeCRUD
from app.models.studyKnowledgeNode import StudyKnowledgeNode, StudyKnowledgeNodeCreate, StudyKnowledgeNodeListResponse, StudyKnowledgeNodeUpdate
from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection
from app.models.studySourceSection import StudySourceSection
from app.models.studySource import StudySource
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlmodel import Session, select
from datetime import datetime
from app.core.utils import parse_refine_filters

import logging
from app.core.logger import init_logger
init_logger()
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", dependencies=[Depends(has_permission("studyKnowledgeNode:create"))], response_model=StudyKnowledgeNode)
def create_item(
    item_in: StudyKnowledgeNodeCreate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    logger.debug(f"Creating StudyKnowledgeNode with current_dept_id: {current_dept_id}")
    logger.debug(f"Creating StudyKnowledgeNode with current_user_id: {current_user_id}")
    crud = StudyKnowledgeNodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item_in.creator = str(current_user_id)
    item_in.dept_id = current_dept_id
    return crud.create(item_in)

@router.get("", dependencies=[Depends(has_permission("studyKnowledgeNode:list"))], response_model=StudyKnowledgeNodeListResponse)
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

    crud = StudyKnowledgeNodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    skip = _start
    limit = _end - _start
    sortField = query_params.get("sortField")
    sortOrder = query_params.get("sortOrder")

    order_by = None
    if sortField and sortOrder:
        field = getattr(StudyKnowledgeNode, sortField, None)
        if field is not None:
            order_by = field.asc() if sortOrder.lower() == "asc" else field.desc()

    items = crud.list_all(skip=skip, limit=limit, filters=filters, order_by=order_by)
    total = crud.count_all(filters=filters)

    return {"data": items, "total": total}

@router.get("/{item_id}", dependencies=[Depends(has_permission("studyKnowledgeNode:show"))], response_model=StudyKnowledgeNode)
def get_item(
    item_id: int, 
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyKnowledgeNodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    item = crud.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="StudyKnowledgeNode not found")
    return item

@router.patch("/{item_id}", dependencies=[Depends(has_permission("studyKnowledgeNode:edit"))], response_model=StudyKnowledgeNode)
def update_item(
    item_id: int,
    item_in: StudyKnowledgeNodeUpdate,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyKnowledgeNodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyKnowledgeNode not found")
    item_in.updater = str(current_user_id)
    return crud.update(db_item, item_in)

@router.delete("/{item_id}", dependencies=[Depends(has_permission("studyKnowledgeNode:delete"))], response_model=StudyKnowledgeNode)
def delete_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
    current_dept_id: int = Depends(get_current_dept_id),
):
    crud = StudyKnowledgeNodeCRUD(session, user_id=current_user_id, dept_id=current_dept_id)
    db_item = crud.get_by_id(item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="StudyKnowledgeNode not found")
    db_item.updater = str(current_user_id)
    return crud.soft_delete(db_item)


@router.get("/{item_id}/sources", dependencies=[Depends(has_permission("studyKnowledgeNode:show"))])
def get_knowledge_sources(
    item_id: int,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
):
    """获取知识点的来源信息（章节和教材）"""
    # 获取知识点与章节的关联
    links = session.exec(
        select(StudyKnowledgeSourceSection).where(
            StudyKnowledgeSourceSection.knowledge_node_id == item_id,
            StudyKnowledgeSourceSection.deleted == False
        )
    ).all()
    
    if not links:
        return {"sources": []}
    
    # 获取章节信息
    section_ids = [link.source_section_id for link in links]
    sections = session.exec(
        select(StudySourceSection).where(
            StudySourceSection.id.in_(section_ids),
            StudySourceSection.deleted == False
        )
    ).all()
    
    if not sections:
        return {"sources": []}
    
    # 获取来源（教材）信息
    source_ids = list(set(s.source_id for s in sections if s.source_id))
    sources = {}
    if source_ids:
        source_list = session.exec(
            select(StudySource).where(
                StudySource.id.in_(source_ids),
                StudySource.deleted == False
            )
        ).all()
        sources = {s.id: s for s in source_list}
    
    # 构建响应
    result = []
    for section in sections:
        source = sources.get(section.source_id) if section.source_id else None
        result.append({
            "section_id": section.id,
            "chapter": section.chapter,
            "section": section.section,
            "page_start": section.page_start,
            "page_end": section.page_end,
            "anchor_text": section.anchor_text,
            "source": {
                "id": source.id,
                "type": source.type,
                "title": source.title,
                "version": source.version,
            } if source else None
        })
    
    return {"sources": result}