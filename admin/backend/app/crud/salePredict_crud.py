from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.models.salePredict import SalePredict, SalePredictCreate, SalePredictUpdate
from sqlalchemy import func
from sqlalchemy.sql.elements import UnaryExpression
from sqlmodel import select
from app.crud.base import BaseCRUD
from app.utils.clickhouse_client import clickhouse_client
import pandas as pd
from prophet import Prophet

from app.core.logger import init_logger
import logging
init_logger()
logger = logging.getLogger(__name__) 

class SalePredictCRUD(BaseCRUD):
    model = SalePredict

    def get_by_id(self, salePredict_id: int) -> Optional[SalePredict]:
        statement = select(SalePredict).where(SalePredict.id == salePredict_id, SalePredict.deleted == False)
        result = self.session.exec(statement).first()
        return result

    def create(self, obj_in: SalePredictCreate) -> SalePredict:
        db_obj = SalePredict(**obj_in.dict())
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def update(self, db_obj: SalePredict, obj_in: SalePredictUpdate) -> SalePredict:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db_obj.update_time = datetime.utcnow()
        self.session.add(db_obj)
        self.session.commit()
        self.session.refresh(db_obj)
        return db_obj

    def soft_delete(self, db_obj: SalePredict) -> SalePredict:
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
    ) -> List[SalePredict]:
        query = select(SalePredict).where(SalePredict.deleted == False)
        query = self._apply_filters(query, filters)
        if order_by is not None:
            query = query.order_by(order_by)
        else:
            query = query.order_by(SalePredict.id.desc())
        return self.session.exec(query.offset(skip).limit(limit)).all()

    def count_all(self, filters: Optional[Dict[str, Any]] = None) -> int:
        query = select(func.count()).select_from(SalePredict).where(SalePredict.deleted == False)
        query = self._apply_filters(query, filters)
        return self.session.exec(query).one()
    
    #同步数仓数据
    def sync_data(self, creator_id: int, dept_id: int) -> int:
        query_sql = """
            SELECT
                stat_year,
                stat_month,
                sku,
                sumMerge(total_sales_quantity) AS sales_quantity
            FROM fact_cac_sale_orders_monthly_agg
            GROUP BY
                stat_year,
                stat_month,
                sku
            ORDER BY
                sku,stat_year,stat_month
        """

        rows: List[Tuple] = clickhouse_client.execute(query_sql)
        logger.info(f"Fetched {len(rows)} rows from ClickHouse")

        if not rows:
            return 0

        # 1. soft delete
        self.session.query(SalePredict).update({SalePredict.deleted: True})
        self.session.commit()

        # 2. 构造要插入的对象
        for row in rows:
            obj_in = SalePredict(
                stat_year=row[0],
                stat_month=row[1],
                sku=row[2],
                sales_quantity=row[3],
                creator=creator_id,
                dept_id=dept_id,
            )
            self.session.add(obj_in)

        self.session.commit()

        return len(rows)


    def linear_trend_predict(self, sales: List[float], months: int) -> List[int]:
        """
        基于线性趋势预测未来 N 个月销量
        :param sales: 历史销量列表
        :param months: 预测月份数
        :return: 预测销量列表
        """
        if not sales:
            return [0] * months

        if len(sales) > 1:
            monthly_trend = sum(sales[i+1] - sales[i] for i in range(len(sales)-1)) / (len(sales)-1)
        else:
            monthly_trend = 0

        last_sales = sales[-1]
        forecast = [max(int(last_sales + monthly_trend * (i+1)), 0) for i in range(months)]
        return forecast

    def predict_data(self, creator_id: int, dept_id: int, months: int = 6) -> int:
        """
        对每个 SKU 进行未来 N 个月销量预测，并写入 predict_quantity
        :param creator_id: 创建人ID
        :param dept_id: 部门ID
        :param months: 预测的月份数（默认6个月）
        :return: 新增预测数据条数
        """
        # 1) 删除已有预测数据
        deleted_count = self.session.query(SalePredict).filter(
            SalePredict.predict_quantity > -1
        ).delete()
        self.session.commit()
        logger.info(f"删除已有预测数据: {deleted_count} 条")

        # 2) 查询历史销量
        rows: List[Tuple] = self.session.query(
            SalePredict.sku,
            SalePredict.stat_year,
            SalePredict.stat_month,
            SalePredict.sales_quantity
        ).filter(SalePredict.deleted == False).all()

        if not rows:
            logger.info("无历史销量数据，退出预测")
            return 0

        df_rows = pd.DataFrame(rows, columns=['sku', 'year', 'month', 'sales_quantity'])
        total_new = 0

        # 3) 按 SKU 分组进行预测
        for sku, group in df_rows.groupby('sku'):
            df_sku = group.copy().sort_values(["year", "month"])
            sales = df_sku['sales_quantity'].fillna(0).tolist()

            logger.info(f"SKU={sku}, 历史销量={sales}")

            # 使用线性趋势预测
            forecast_values = self.linear_trend_predict(sales, months)
            forecast_dates = pd.date_range(start=datetime.utcnow(), periods=months, freq="MS")

            # 4) 写入数据库
            for dt, pred in zip(forecast_dates, forecast_values):
                year, month = dt.year, dt.month
                obj = self.session.query(SalePredict).filter(
                    SalePredict.sku == sku,
                    SalePredict.stat_year == year,
                    SalePredict.stat_month == month
                ).first()

                if obj:
                    obj.predict_quantity = pred
                    obj.creator = creator_id
                    obj.dept_id = dept_id
                    obj.update_time = datetime.utcnow()
                    self.session.add(obj)
                else:
                    obj_new = SalePredict(
                        sku=sku,
                        stat_year=year,
                        stat_month=month,
                        sales_quantity=0,
                        predict_quantity=pred,
                        creator=creator_id,
                        dept_id=dept_id,
                        deleted=False,
                        create_time=datetime.utcnow(),
                        update_time=datetime.utcnow()
                    )
                    self.session.add(obj_new)
                    total_new += 1

            logger.info(f"SKU {sku} 预测完成，共写入 {len(forecast_values)} 条预测数据")

        self.session.commit()
        logger.info(f"预测完成，总新增预测数据条数: {total_new}")
        return total_new