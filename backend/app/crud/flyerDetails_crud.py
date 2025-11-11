from datetime import datetime
from typing import Any, Dict, List, Optional

from app.models.flyerDetails import FlyerDetails, FlyerDetailsCreate, FlyerDetailsUpdate
from sqlalchemy import func, or_
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD
from app.utils.es_client import get_es_client


from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

from opensearchpy import helpers


class FlyerDetailsCRUD(BaseCRUD):
    model = FlyerDetails

    def get_by_id(self, flyerDetails_id: int) -> Optional[FlyerDetails]:
        statement = select(FlyerDetails).where(FlyerDetails.id == flyerDetails_id, FlyerDetails.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: FlyerDetailsCreate) -> FlyerDetails:
        db_obj = FlyerDetails(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: FlyerDetails, obj_in: FlyerDetailsUpdate) -> FlyerDetails:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: FlyerDetails) -> FlyerDetails:
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
    ) -> List[FlyerDetails]:
        query = select(FlyerDetails).where(FlyerDetails.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(FlyerDetails.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(FlyerDetails).where(FlyerDetails.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    def list_cn_name_null(self, limit: int = 100) -> List[Dict[str, Any]]:
        stmt = (
            select(FlyerDetails.id, FlyerDetails.name, FlyerDetails.brand)
            .where(FlyerDetails.deleted == False)
            .where(FlyerDetails.name.is_not(None) & (FlyerDetails.name != ""))
            .where(FlyerDetails.cn_name.is_(None) | (FlyerDetails.cn_name == ""))
            .limit(limit)
        )
        rows = self.session.exec(stmt).all()
        return [{"id": row.id, "name": row.name, "brand": row.brand} for row in rows]

    def update_names(self, flyer_id: int, hk_name: str, cn_name: str) -> None:
        if not cn_name:
            cn_name = ''
        if not hk_name:
            hk_name = ''
        hk_name = hk_name[:255] if hk_name else None
        cn_name = cn_name[:255] if cn_name else None
        self.session.exec(
            FlyerDetails.__table__.update()
            .where(FlyerDetails.id == flyer_id)
            .values(hk_name=hk_name, cn_name=cn_name, update_time=datetime.utcnow())
        )
        self.session.commit() 

    def get_unwritten_to_es(self, limit: int = 100):
        statement = select(FlyerDetails).where(
            FlyerDetails.deleted == False,
            or_(
                FlyerDetails.es_deal_flag == False,
                FlyerDetails.es_deal_flag.is_(None)  # NULL 也匹配
            )
        ).limit(limit)
        return self.session.exec(statement).all()
    
    def mark_as_written_to_es(self, flyer_ids: list[int]):
        statement = (
            select(FlyerDetails)
            .where(FlyerDetails.id.in_(flyer_ids))
        )
        items = self.session.exec(statement).all()
        for item in items:
            item.es_deal_flag = True
        self.session.commit()    

    def clear_es_index_data(self, es_client, index_name: str):
        """
        清空索引数据，但保留结构
        """
        try:
            if es_client.indices.exists(index=index_name):
                logger.info(f"ES索引 {index_name} 存在，开始清空数据...")
                es_client.delete_by_query(
                    index=index_name,
                    body={"query": {"match_all": {}}},
                    refresh=True
                )
                logger.info(f"ES索引 {index_name} 数据清空完成")
            else:
                logger.info(f"ES索引 {index_name} 不存在，跳过清空")
        except Exception as e:
            logger.error(f"清空 ES 索引 {index_name} 数据失败: {e}", exc_info=True)
            raise
    # 写入es
    def write_to_es(self, batch_size: int = 100, flyer_fsa_map: dict = None) -> int:
        if flyer_fsa_map is None:
            return 0

        ES_INDEX = "flyer_details"
        es = get_es_client()
        total_synced = 0

        # 每次写入前清空索引数据
        self.clear_es_index_data(es, ES_INDEX)

        while True:
            items = self.get_unwritten_to_es(limit=batch_size)
            if not items:
                break

            actions = []
            flyer_ids = []
            for item in items:
                flyer_ids.append(item.id)

                doc = {
                    "id": item.id,
                    "item_id": item.item_id,
                    "name": item.name,
                    "brand": item.brand,
                    "cn_name": item.cn_name,
                    "hk_name": item.hk_name,
                    "valid_from": item.valid_from if item.valid_from else None,
                    "valid_to": item.valid_to if item.valid_to else None,
                    "available_to": item.available_to if item.available_to else None,
                    "cutout_image_url": item.cutout_image_url,
                    "price": item.price if item.price is not None else None,
                    "flyer_id": item.flyer_id,
                    "fsa_array": flyer_fsa_map.get(item.flyer_id, []),
                    "creator": item.creator,
                    "dept_id": item.dept_id,
                    "updater": item.updater,
                    "deleted": item.deleted,
                    "create_time": item.create_time.isoformat() if item.create_time else None,
                    "update_time": item.update_time.isoformat() if item.update_time else None,
                    "merchant_id": item.merchant_id,
                    "merchant": item.merchant,
                }

                actions.append({
                    "_op_type": "index",
                    "_index": ES_INDEX,
                    "_id": doc["id"],
                    "_source": doc,
                })

            try:
                success, failed = helpers.bulk(es, actions, raise_on_error=False, stats_only=True)
                logger.info(f"ES同步结果 -> 成功: {success}, 失败: {failed}")
            except Exception as e:
                logger.error(f"ES批量写入异常: {e}", exc_info=True)
                break

            # 只有当批量写入全部成功后，才标记为已写入
            if failed == 0:
                self.mark_as_written_to_es(flyer_ids)

            total_synced += success

        logger.info(f"ES同步任务完成，总共写入 {total_synced} 条记录")
        return total_synced
    
    # 查询es
    def search_in_opensearch(
        self,
        query_string: str,
        zip_code: str,
        lang: str,
        start: int = 0,
        end: int = 10
    ) -> list[dict]:
        ES_INDEX = "flyer_details"
        size = end - start
        fsa = zip_code[:3].upper() if zip_code else None
        es = get_es_client()

        # 根据语言选择查询字段
        if lang == "en":
            search_field = "name"
            title_field = "name"
        elif lang == "hk":
            search_field = "hk_name"
            title_field = "hk_name"
        else:  # 默认中文
            search_field = "cn_name"
            title_field = "cn_name"

        # 构造查询
        if not query_string:
            query_body = {
                "from": start,
                "size": size,
                "query": {
                    "bool": {
                        "must": {"match_all": {}},
                        "filter": [{"terms": {"fsa_array": [fsa]}}] if fsa else [],
                    }
                },
                "sort": [{"update_time": {"order": "desc"}}],
            }
        else:
            query_body = {
                "from": start,
                "size": size,
                "query": {
                    "bool": {
                        "must": {
                            "match": {search_field: {"query": query_string, "operator": "and"}}
                        },
                        "filter": [{"terms": {"fsa_array": [fsa]}}] if fsa else [],
                    }
                },
                "sort": [{"update_time": {"order": "desc"}}],
            }

        res = es.search(index=ES_INDEX, body=query_body)
        hits = res.get("hits", {}).get("hits", [])

        # 返回数据时，把动态字段映射为统一字段 title
        results = []
        for hit in hits:
            source = hit["_source"]
            source["title"] = source.get(title_field, "")
            results.append(source)

        return results
    


    