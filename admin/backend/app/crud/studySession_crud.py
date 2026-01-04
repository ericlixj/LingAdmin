from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.studySession import StudySession, StudySessionCreate, StudySessionUpdate
from app.models.studySessionItem import StudySessionItem
from sqlalchemy import func, update
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

def mode_label(mode: str) -> str:
    """获取mode的中文标签"""
    mode_map = {
        "exam": "考试",
        "practice": "练习",
        "review": "复习",
        "flashcard": "FlashCard"
    }
    return mode_map.get(mode, mode)

class StudySessionCRUD(BaseCRUD):
    model = StudySession

    def get_by_id(self, studySession_id: int) -> Optional[StudySession]:
        statement = select(StudySession).where(
            StudySession.id == studySession_id,
            StudySession.deleted == False
        )
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: StudySessionCreate) -> StudySession:
        # 验证：同一个用户，同一种类型（mode）下相同exam的session仅能创建一个
        existing_session = self.session.exec(
            select(StudySession).where(
                StudySession.user_id == obj_in.user_id,
                StudySession.exam_id == obj_in.exam_id,
                StudySession.mode == obj_in.mode,
                StudySession.deleted == False
            )
        ).first()
        
        if existing_session:
            logger.warning(f"Session already exists for user_id={obj_in.user_id}, exam_id={obj_in.exam_id}, mode={obj_in.mode}")
            raise ValueError(f"该用户在此考试下已存在{mode_label(obj_in.mode)}类型的session，请使用现有session或先删除后再创建")
        
        db_obj = StudySession(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        
        # 如果是 FlashCard 模式，自动创建 session_items（不区分大小写）
        if obj_in.mode and obj_in.mode.lower() == "flashcard" and obj_in.exam_id:
            self._create_flashcard_session_items(db_obj, obj_in.exam_id)
        
        return db_obj
    
    def _create_flashcard_session_items(self, session_obj: StudySession, exam_id: int):
        """为 FlashCard 模式的 session 自动创建 session_items，数据来自该 exam 的知识点对应的 learning_item"""
        from app.models.studyKnowledgeNode import StudyKnowledgeNode
        from app.models.studyLearningItem import StudyLearningItem
        from app.models.studySessionItem import StudySessionItem, StudySessionItemCreate
        from app.crud.studySessionItem_crud import StudySessionItemCRUD
        
        logger.info(f"为 FlashCard session 创建 session_items，session_id={session_obj.id}, exam_id={exam_id}")
        
        try:
            # 1. 获取该 exam 下所有有效的知识点
            knowledge_nodes_stmt = select(StudyKnowledgeNode).where(
                StudyKnowledgeNode.exam_id == exam_id,
                StudyKnowledgeNode.deleted == False
            )
            knowledge_nodes = self.session.exec(knowledge_nodes_stmt).all()
            
            if not knowledge_nodes:
                logger.warning(f"Exam {exam_id} 下没有找到知识点")
                return
            
            logger.info(f"找到 {len(knowledge_nodes)} 个知识点")
            
            # 2. 获取这些知识点对应的 learning_item（type='knowledge'）
            knowledge_ids = [kn.id for kn in knowledge_nodes]
            learning_items_stmt = select(StudyLearningItem).where(
                StudyLearningItem.type == "knowledge",
                StudyLearningItem.ref_id.in_(knowledge_ids),
                StudyLearningItem.deleted == False
            )
            learning_items = self.session.exec(learning_items_stmt).all()
            
            if not learning_items:
                logger.warning(f"没有找到知识点对应的 learning_item")
                return
            
            logger.info(f"找到 {len(learning_items)} 个知识点对应的 learning_item")
            
            # 3. 为每个 learning_item 创建 session_item
            session_item_crud = StudySessionItemCRUD(self.session, user_id=self.user_id, dept_id=self.dept_id)
            created_count = 0
            
            for learning_item in learning_items:
                # 检查是否已存在相同的 session_item（避免重复创建）
                existing_item = self.session.exec(
                    select(StudySessionItem).where(
                        StudySessionItem.session_id == session_obj.id,
                        StudySessionItem.learning_item_id == learning_item.id,
                        StudySessionItem.deleted == False
                    )
                ).first()
                
                if existing_item:
                    logger.debug(f"Session item 已存在: session_id={session_obj.id}, learning_item_id={learning_item.id}")
                    continue
                
                # 创建新的 session_item
                # 对于 FlashCard 模式，初始创建时设置所有非空字段的默认值
                session_item_create = StudySessionItemCreate(
                    session_id=session_obj.id,
                    learning_item_id=learning_item.id,
                    is_correct=0,  # 初始状态：未答题
                    response="",  # 初始状态：未答题，空字符串
                    time_spent_second=0,  # 初始状态：未开始学习，耗时0秒
                    creator=str(self.user_id),
                    dept_id=self.dept_id,
                )
                session_item_crud.create(session_item_create)
                created_count += 1
                
                # 每50条提交一次
                if created_count % 50 == 0:
                    self.session.commit()
                    logger.info(f"已创建 {created_count} 个 session_item...")
            
            self.session.commit()
            logger.info(f"FlashCard session_items 创建完成，共创建 {created_count} 个")
            
        except Exception as e:
            logger.error(f"创建 FlashCard session_items 失败: {e}", exc_info=True)
            self.session.rollback()
            # 不抛出异常，避免影响 session 的创建
            logger.warning(f"创建 session_items 失败，但 session 已创建成功")

    def update(self, db_obj: StudySession, obj_in: StudySessionUpdate) -> StudySession:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: StudySession) -> StudySession:
        # 软删主表
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)

        # 同时软删关联的子表数据
        self.session.execute(
            update(StudySessionItem)
            .where(StudySessionItem.session_id == db_obj.id)
            .values(
                deleted=True,
                update_time=datetime.utcnow()
            )
        )

        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[StudySession]:
        query = select(StudySession).where(StudySession.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(StudySession.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(StudySession).where(StudySession.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()