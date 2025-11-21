"""
Gas价格邮件通知工具
在gas爬虫成功后，给用户发送5公里内gas价格排序的邮件
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime
from collections import defaultdict
from sqlmodel import Session, select
from app.core.db import engine
from app.core.config import settings
from app.models.user import User
from app.models.userPostcode import UserPostcode
from app.models.gasStation import GasStation
from app.models.gasPrice import GasPrice
from app.utils.email_sender import email_sender
from app.crud.gasEmailHistory_crud import GasEmailHistoryCRUD

logger = logging.getLogger(__name__)

# 价格提醒阈值（写死150）
PRICE_ALERT_THRESHOLD = 150.0


def get_gas_prices_within_5km(postcode: str, fuel_product: int = 1) -> List[Dict]:
    """
    获取指定邮编的gas价格，按价格从小到大排序（仅使用Regular类型，fuel_product=1）
    暂时不考虑距离限制，获取该邮编下所有加油站的价格
    
    Args:
        postcode: 邮编
        fuel_product: 油品类型（固定为1=regular_gas），默认1
        
    Returns:
        按价格从小到大排序的gas价格列表（不考虑距离）
    """
    # 固定使用Regular类型
    fuel_product = 1
    
    with Session(engine) as session:
        # 查询该邮编的所有加油站（暂时不考虑距离限制）
        all_stations = session.exec(
            select(GasStation).where(
                GasStation.postcode == postcode,
                GasStation.deleted == False
            )
        ).all()
        
        logger.info(f"[GasEmail] Found {len(all_stations)} stations for postcode {postcode}")
        
        if not all_stations:
            logger.warning(f"[GasEmail] No stations found for postcode {postcode}")
            return []
        
        # 暂时不使用距离过滤，直接使用所有加油站
        filtered_stations = all_stations
        
        # 获取每个加油站的最新价格（仅Regular类型，fuel_product=1）
        prices = []
        stations_without_price = []
        
        for station in filtered_stations:
            # 获取距离信息（如果可用）
            try:
                if station.distance and station.distance != "" and station.distance != "0":
                    distance_float = float(station.distance)
                else:
                    distance_float = None  # 距离信息不可用
            except (ValueError, TypeError):
                distance_float = None
                
            # 获取该加油站最新价格（仅Regular类型，fuel_product=1）
            latest_price = session.exec(
                select(GasPrice).where(
                    GasPrice.station_id == station.station_id,
                    GasPrice.fuel_product == 1,  # 固定使用Regular类型
                    GasPrice.deleted == False
                ).order_by(GasPrice.crawl_time.desc()).limit(1)
            ).first()
            
            if latest_price:
                try:
                    price_float = float(latest_price.cash_price)
                    prices.append({
                        'station_name': station.name or "Unknown",
                        'address': station.address or "",
                        'distance': distance_float if distance_float is not None else 0.0,
                        'price': price_float,
                        'formatted_price': latest_price.cash_formatted_price or f"${price_float:.3f}",
                        'crawl_time': latest_price.crawl_time
                    })
                except (ValueError, TypeError) as e:
                    logger.warning(f"[GasEmail] Failed to parse price for station {station.station_id}: {latest_price.cash_price}, error: {e}")
                    stations_without_price.append(station.station_id)
                    continue
            else:
                stations_without_price.append(station.station_id)
                logger.debug(f"[GasEmail] No Regular price found for station {station.station_id} ({station.name})")
        
        if stations_without_price:
            logger.warning(f"[GasEmail] {len(stations_without_price)} stations have no Regular price: {stations_without_price[:5]}")
        
        logger.info(f"[GasEmail] Found {len(prices)} prices for postcode {postcode} (out of {len(filtered_stations)} stations)")
        
        # 按价格排序（升序，最便宜的在前），不考虑距离
        prices.sort(key=lambda x: x['price'])
        
        return prices


def generate_multi_postcode_email_content(
    user_email: str, 
    postcode_data: Dict[str, List[Dict]], 
    postcode_label_map: Optional[Dict[str, str]] = None,
    fuel_product_name: str = "Regular Gas"
) -> tuple[str, str]:
    """
    生成包含多个邮编的gas价格邮件内容
    
    Args:
        user_email: 用户邮箱
        postcode_data: 字典，key为邮编，value为该邮编的价格列表
        postcode_label_map: 字典，key为邮编，value为该邮编的label（标识），用于优先级排序
        fuel_product_name: 油品名称
        
    Returns:
        (text_content, html_content) 元组
    """
    if not postcode_data:
        text_content = "Gas Price Update\n\n"
        text_content += "No gas stations found with available prices.\n"
        
        html_content = """
        <html>
        <body>
            <h2>Gas Price Update</h2>
            <p>No gas stations found with available prices.</p>
        </body>
        </html>
        """
        return text_content, html_content
    
    # 如果没有提供 label 映射，创建空字典
    if postcode_label_map is None:
        postcode_label_map = {}
    
    # 按 label 优先级排序邮编：有 label 的优先，label 不为空的更优先
    def get_postcode_priority(postcode: str) -> tuple[int, str]:
        """返回排序优先级：(0=有label且非空, 1=有label但为空, 2=无label), label值"""
        label = postcode_label_map.get(postcode, "")
        if label and label.strip():
            return (0, label.lower())  # 有有效 label，按 label 字母顺序排序
        elif label:
            return (1, postcode)  # 有 label 但为空
        else:
            return (2, postcode)  # 无 label
    
    # 排序邮编：label 优先，其次按邮编排序
    sorted_postcodes = sorted(postcode_data.keys(), key=get_postcode_priority)
    
    # 检查是否有价格低于阈值
    has_alert = False
    lowest_price = None
    for postcode, prices in postcode_data.items():
        if prices and len(prices) > 0:
            min_price = prices[0]['price']
            if lowest_price is None or min_price < lowest_price:
                lowest_price = min_price
            if min_price < PRICE_ALERT_THRESHOLD:
                has_alert = True
    
    # 文本版本
    text_content = "Gas Price Update\n\n"
    if has_alert and lowest_price is not None:
        text_content += f"⚠️ 价格提醒：发现低于 ${PRICE_ALERT_THRESHOLD:.2f} 的价格！最低价格: ${lowest_price:.3f}\n\n"
    
    for postcode in sorted_postcodes:
        prices = postcode_data[postcode]
        label = postcode_label_map.get(postcode, "")
        has_label = bool(label and label.strip())
        
        if not prices:
            label_info = f" ({label})" if has_label else ""
            text_content += f"\n{postcode}{label_info}: No prices found\n"
            continue
        
        label_info = f" ({label})" if has_label else ""
        header_label = "⭐ " if has_label else ""
        text_content += f"\n{header_label}{fuel_product_name} Prices for {postcode}{label_info} (sorted by price, cheapest first):\n\n"
        
        for idx, price_info in enumerate(prices[:10], 1):  # 每个邮编最多显示10个
            text_content += f"  {idx}. {price_info['station_name']}\n"
            text_content += f"     Price: {price_info['formatted_price']}\n"
            if price_info.get('distance') and price_info['distance'] > 0:
                text_content += f"     Distance: {price_info['distance']:.2f} km\n"
            if price_info['address']:
                text_content += f"     Address: {price_info['address']}\n"
            text_content += "\n"
    
    text_content += f"\nUpdated at: {datetime.utcnow()}\n"
    
    # HTML版本
    alert_banner = ""
    if has_alert and lowest_price is not None:
        alert_banner = f"""
        <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <h3 style="color: #856404; margin: 0;">⚠️ 价格提醒</h3>
            <p style="color: #856404; margin: 5px 0 0 0;">
                发现低于 ${PRICE_ALERT_THRESHOLD:.2f} 的价格！最低价格: <strong>${lowest_price:.3f}</strong>
            </p>
        </div>
        """
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h2 {{ color: #333; }}
            h3 {{ color: #555; margin-top: 30px; }}
            table {{ border-collapse: collapse; width: 100%; margin-top: 20px; margin-bottom: 30px; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #4CAF50; color: white; }}
            tr:nth-child(even) {{ background-color: #f2f2f2; }}
            .price {{ color: #e74c3c; font-weight: bold; }}
            .distance {{ color: #7f8c8d; }}
            .address {{ color: #555; font-size: 0.9em; }}
            .postcode-section {{ margin-bottom: 40px; }}
            .postcode-section.label {{ 
                background-color: #fff9e6; 
                border: 2px solid #ffd700; 
                border-radius: 8px; 
                padding: 20px; 
                margin-bottom: 30px;
            }}
            .postcode-section.label h3 {{
                color: #856404;
                font-weight: bold;
            }}
            .label-badge {{
                background-color: #ffd700;
                color: #856404;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 0.85em;
                font-weight: bold;
                margin-left: 10px;
            }}
        </style>
    </head>
    <body>
        <h2>Gas Price Update</h2>
        {alert_banner}
    """
    
    for postcode in sorted_postcodes:
        prices = postcode_data[postcode]
        label = postcode_label_map.get(postcode, "")
        has_label = bool(label and label.strip())
        
        if not prices:
            label_html = f' <span class="label-badge">{label}</span>' if has_label else ""
            html_content += f"""
        <div class="postcode-section{' label' if has_label else ''}">
            <h3>{postcode}{label_html}: No prices found</h3>
        </div>
            """
            continue
        
        label_html = f' <span class="label-badge">{label}</span>' if has_label else ""
        section_class = "postcode-section label" if has_label else "postcode-section"
        header_icon = "⭐ " if has_label else ""
        
        html_content += f"""
        <div class="{section_class}">
            <h3>{header_icon}{fuel_product_name} Prices for {postcode}{label_html}</h3>
            <p>(sorted by price, cheapest first)</p>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Station Name</th>
                    <th>Price</th>
                    <th>Distance</th>
                    <th>Address</th>
                </tr>
        """
        
        for idx, price_info in enumerate(prices[:10], 1):  # 每个邮编最多显示10个
            distance_display = f"{price_info['distance']:.2f} km" if price_info.get('distance') and price_info['distance'] > 0 else "N/A"
            html_content += f"""
                <tr>
                    <td>{idx}</td>
                    <td>{price_info['station_name']}</td>
                    <td class="price">{price_info['formatted_price']}</td>
                    <td class="distance">{distance_display}</td>
                    <td class="address">{price_info['address'] or 'N/A'}</td>
                </tr>
            """
        
        html_content += """
            </table>
        </div>
        """
    
    html_content += f"""
        <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
            Updated at: {datetime.utcnow()}
        </p>
    </body>
    </html>
    """
    
    return text_content, html_content


# 注意：should_send_email() 函数已移除，不再使用时间窗口限制


def check_price_alert(prices: List[Dict]) -> bool:
    """
    检查价格是否低于提醒阈值
    
    Args:
        prices: 价格列表
        
    Returns:
        如果最低价格低于阈值，返回True
    """
    if not prices or len(prices) == 0:
        return False
    
    min_price = prices[0]['price']  # 已按价格排序，第一个是最低的
    if min_price < PRICE_ALERT_THRESHOLD:
        logger.info(f"[Email] Price alert triggered: min price ${min_price:.3f} < threshold ${PRICE_ALERT_THRESHOLD:.2f}")
        return True
    
    return False


async def send_gas_price_emails():
    """
    在gas爬虫成功后，给所有用户发送gas价格邮件（仅价格提醒）
    完全异步执行，不影响数据入库流程
    
    规则：
    1. 如果价格低于阈值（150），立即发送
    2. 每个用户2小时内只发送一次价格提醒邮件（冷却期）
    3. 一个用户多个邮编，聚合到一份邮件中
    """
    try:
        logger.info("[Email] Starting to send gas price alert emails to users...")
        
        # 使用独立的数据库会话，不影响主流程
        with Session(engine) as session:
            email_history_crud = GasEmailHistoryCRUD(session, user_id=1, dept_id=0)
            
            # 获取所有有邮编的用户，按用户分组
            user_postcodes = session.exec(
                select(UserPostcode, User).join(
                    User, UserPostcode.user_id == User.id
                ).where(
                    UserPostcode.deleted == False,
                    UserPostcode.postcode != "",
                    UserPostcode.postcode.isnot(None),
                    User.is_active == True,
                    User.deleted == False,
                    User.email.isnot(None)
                )
            ).all()
            
            if not user_postcodes:
                logger.info("[Email] No users with postcodes found")
                return
            
            # 按用户分组，一个用户可能有多个邮编，同时保存 label 信息
            user_postcode_map = defaultdict(list)
            user_postcode_label_map = defaultdict(dict)  # 存储每个用户的邮编和 label 映射
            user_map = {}
            
            for user_postcode, user in user_postcodes:
                if not user.email:
                    continue
                
                postcode = user_postcode.postcode
                if not postcode:
                    continue
                
                user_postcode_map[user.id].append(postcode)
                # 保存邮编和 label 的映射
                if user_postcode.label:
                    user_postcode_label_map[user.id][postcode] = user_postcode.label
                user_map[user.id] = user
            
            logger.info(f"[Email] Found {len(user_map)} users with postcodes")
            
            # 为每个用户发送邮件（聚合所有邮编）
            sent_count = 0
            failed_count = 0
            skipped_cooldown_count = 0
            
            for user_id, postcodes in user_postcode_map.items():
                user = user_map[user_id]
                
                try:
                    # 获取该用户所有邮编的价格数据
                    postcode_data = {}
                    has_alert = False
                    lowest_price = None
                    alert_postcode = None
                    
                    for postcode in postcodes:
                        prices = get_gas_prices_within_5km(postcode, fuel_product=1)
                        if prices:
                            postcode_data[postcode] = prices
                            # 检查价格提醒
                            if check_price_alert(prices):
                                min_price = prices[0]['price']
                                if lowest_price is None or min_price < lowest_price:
                                    lowest_price = min_price
                                    alert_postcode = postcode
                                has_alert = True
                    
                    # 只有当价格低于阈值时才发送
                    if not has_alert:
                        logger.debug(f"[Email] Skipping email to {user.email}: no price below threshold")
                        continue
                    
                    if not postcode_data:
                        logger.info(f"[Email] No prices found for user {user.email}")
                        continue
                    
                    # 检查2小时内是否已发送过价格提醒邮件
                    if email_history_crud.check_recent_alert_sent(user_id, hours=2):
                        logger.info(
                            f"[Email] Skipping email to {user.email}: "
                            f"alert email sent within last 2 hours (cooldown)"
                        )
                        skipped_cooldown_count += 1
                        continue
                    
                    # 获取该用户的邮编 label 映射
                    postcode_label_map = user_postcode_label_map.get(user_id, {})
                    
                    # 生成聚合邮件内容（包含所有邮编，按 label 优先级排序）
                    text_content, html_content = generate_multi_postcode_email_content(
                        user.email, postcode_data, postcode_label_map=postcode_label_map, fuel_product_name="Regular Gas"
                    )
                    
                    # 生成邮件主题（价格提醒）
                    subject = f"LingAdmin系统通知 - Gas Price Alert (低于 ${PRICE_ALERT_THRESHOLD:.2f})"
                    
                    # 异步发送邮件（不阻塞）
                    await email_sender.send_email(
                        recipients=[user.email],
                        subject=subject,
                        body=text_content,
                        body_html=html_content
                    )
                    
                    # 记录邮件发送历史
                    sent_time = datetime.utcnow()
                    email_history_crud.create_email_record(
                        user_id=user_id,
                        email_type='alert',
                        sent_time=sent_time,
                        postcode=alert_postcode,  # 记录触发提醒的邮编
                        user_id_for_creator=user_id,
                        dept_id=user.dept_id if hasattr(user, 'dept_id') else 0,
                    )
                    
                    sent_count += 1
                    
                    logger.info(
                        f"[Email] Sent gas price alert email to {user.email} "
                        f"({len(postcode_data)} postcodes, lowest price: ${lowest_price:.3f})"
                    )
                    
                except Exception as e:
                    failed_count += 1
                    logger.error(f"[Email] Error sending email to {user.email}: {e}", exc_info=True)
                    # 继续处理下一个用户，不中断流程
                    continue
        
        logger.info(
            f"[Email] Finished sending gas price alert emails - "
            f"Sent: {sent_count}, Skipped (cooldown): {skipped_cooldown_count}, Failed: {failed_count}"
        )
        
    except Exception as e:
        logger.error(f"[Email] Error in send_gas_price_emails: {e}", exc_info=True)
        # 不抛出异常，确保不影响主流程
