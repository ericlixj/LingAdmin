from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.product4Sephora import Product4Sephora, Product4SephoraCreate, Product4SephoraUpdate, Product4SephoraScrapeRequest
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD
from app.utils import scrape_util 
from app.core.exceptions import BusinessException
import json

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class Product4SephoraCRUD(BaseCRUD):
    model = Product4Sephora

    def get_by_id(self, product4Sephora_id: int) -> Optional[Product4Sephora]:
        statement = select(Product4Sephora).where(Product4Sephora.id == product4Sephora_id, Product4Sephora.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: Product4SephoraCreate) -> Product4Sephora:
        db_obj = Product4Sephora(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Product4Sephora, obj_in: Product4SephoraUpdate) -> Product4Sephora:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: Product4Sephora) -> Product4Sephora:
        db_obj.deleted = True
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def list_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[UnaryExpression] = None,
    ) -> List[Product4Sephora]:
        query = select(Product4Sephora).where(Product4Sephora.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(Product4Sephora.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(Product4Sephora).where(Product4Sephora.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    def scrape(self, obj_in: Product4SephoraScrapeRequest) -> Product4Sephora:
        skuId = obj_in.skuId
        productId = obj_in.productId
        creator = obj_in.creator
        dept_id = obj_in.dept_id
        self.session.query(Product4Sephora).filter(Product4Sephora.skuId == skuId).delete()
        self.session.commit()
        # 抓取
        try:
            product_info = scrape_util.scrape_sephora(productId, skuId)
            if not product_info:
                raise BusinessException("抓取返回空数据")

            # 必填字段检查
            required_fields = ["productId", "skuId", "productName", "listPrice"]
            for field in required_fields:
                if field not in product_info or product_info[field] is None:
                    raise BusinessException(f"抓取数据缺失字段: {field}")

            # images 转 json
            product_info['images'] = json.dumps(product_info.get('images', []))

            # 构造数据库对象
            db_obj = Product4Sephora(**product_info)
            db_obj.creator = creator
            db_obj.dept_id = dept_id

            # 写入数据库
            self.session.add(db_obj)
            self.session.commit()
            self.session.refresh(db_obj)

            return db_obj

        except Exception as e:
            # 记录异常并返回失败
            print(f"抓取或保存失败: {e}")
            raise BusinessException(f"抓取或保存失败: {e}")