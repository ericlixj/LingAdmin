"""
Gas价格邮件通知工具
在gas爬虫成功后，给用户发送5公里内gas价格排序的邮件
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone as dt_timezone, timedelta
from zoneinfo import ZoneInfo
from collections import defaultdict
from sqlmodel import Session, select
from sqlalchemy import desc
from app.core.db import engine
from app.core.config import settings
from app.models.user import User
from app.models.userPostcode import UserPostcode
from app.models.gasStation import GasStation
from app.models.gasPrice import GasPrice
from app.models.gasPostcode import GasPostcode
from app.utils.email_sender import email_sender
from app.crud.gasEmailHistory_crud import GasEmailHistoryCRUD

logger = logging.getLogger(__name__)

# 价格提醒阈值（从配置读取，默认150）
PRICE_ALERT_THRESHOLD = settings.GASBUDDY_PRICE_ALERT_THRESHOLD

# 加拿大省份代码到时区的映射
CANADA_PROVINCE_TIMEZONE_MAP = {
    "BC": "America/Vancouver",  # 不列颠哥伦比亚省 - 太平洋时区
    "AB": "America/Edmonton",   # 阿尔伯塔省 - 山地时区
    "SK": "America/Regina",     # 萨斯喀彻温省 - 中部时区（全年标准时间）
    "MB": "America/Winnipeg",   # 马尼托巴省 - 中部时区
    "ON": "America/Toronto",    # 安大略省 - 东部时区
    "QC": "America/Montreal",   # 魁北克省 - 东部时区
    "NB": "America/Moncton",    # 新不伦瑞克省 - 大西洋时区
    "NS": "America/Halifax",    # 新斯科舍省 - 大西洋时区
    "PE": "America/Halifax",    # 爱德华王子岛省 - 大西洋时区
    "NL": "America/St_Johns",   # 纽芬兰与拉布拉多省 - 纽芬兰时区
    "YT": "America/Whitehorse", # 育空地区 - 山地时区
    "NT": "America/Yellowknife", # 西北地区 - 山地时区
    "NU": "America/Iqaluit",    # 努纳武特地区 - 东部时区
    # 默认使用东部时区（多伦多）
    "DEFAULT": "America/Toronto"
}


def get_timezone_by_postcode(postcode: str, session: Optional[Session] = None) -> ZoneInfo:
    """
    根据邮编获取对应的时区
    
    Args:
        postcode: 邮编
        session: 数据库会话（可选），用于查询邮编信息
        
    Returns:
        对应的时区对象，默认为东部时区（America/Toronto）
    """
    try:
        # 如果有session，尝试从数据库查询region_code
        if session:
            postcode_record = session.exec(
                select(GasPostcode).where(
                    GasPostcode.postcode == postcode.replace(" ", "").upper(),
                    GasPostcode.deleted == False
                )
            ).first()
            
            if postcode_record and postcode_record.region_code:
                region_code = postcode_record.region_code.upper()
                timezone_name = CANADA_PROVINCE_TIMEZONE_MAP.get(region_code)
                if timezone_name:
                    return ZoneInfo(timezone_name)
        
        # 如果没有找到，尝试根据邮编前缀判断（加拿大邮编格式：A0A 0A0）
        # 第一字母对应区域：
        # K, L, M, N, P: 安大略省 (东部时区)
        # G, H, J: 魁北克省 (东部时区)
        # A, B, C, E: 大西洋省份 (大西洋时区)
        # R, S, T: 西部省份 (山地/太平洋时区)
        # V: 不列颠哥伦比亚省 (太平洋时区)
        # Y: 育空地区 (山地时区)
        clean_postcode = postcode.replace(" ", "").upper()
        if clean_postcode:
            first_char = clean_postcode[0]
            if first_char in ['V']:
                return ZoneInfo("America/Vancouver")  # BC
            elif first_char in ['T', 'S', 'R']:
                return ZoneInfo("America/Edmonton")  # AB/SK/MB
            elif first_char in ['K', 'L', 'M', 'N', 'P', 'G', 'H', 'J']:
                return ZoneInfo("America/Toronto")  # ON/QC
            elif first_char in ['A', 'B', 'C', 'E']:
                return ZoneInfo("America/Halifax")  # 大西洋省份
            elif first_char == 'Y':
                return ZoneInfo("America/Whitehorse")  # YT
        
        # 默认返回东部时区
        return ZoneInfo(CANADA_PROVINCE_TIMEZONE_MAP["DEFAULT"])
    except Exception as e:
        logger.warning(f"Failed to determine timezone for postcode {postcode}: {e}")
        return ZoneInfo(CANADA_PROVINCE_TIMEZONE_MAP["DEFAULT"])


def format_relative_time(dt, reference_time) -> str:
    """
    格式化时间为相对于参考时间的相对时间（如"15分钟前"）
    直接计算差值，不考虑时区问题
    
    Args:
        dt: 要格式化的时间（通常是发布时间），datetime 对象或字符串
        reference_time: 参考时间（通常是当前时间），datetime 对象或字符串
        
    Returns:
        相对时间字符串，如"15分钟前"、"2小时前"、"刚刚"等
    """
    if dt is None or reference_time is None:
        return "N/A"
    
    try:
        # 将 dt 转换为 datetime 对象
        dt_obj = None
        if isinstance(dt, str):
            # 尝试解析字符串格式的时间
            for fmt in [
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%SZ",
            ]:
                try:
                    dt_obj = datetime.strptime(dt, fmt)
                    break
                except ValueError:
                    continue
            else:
                try:
                    dt_obj = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                    if dt_obj.tzinfo:
                        dt_obj = dt_obj.replace(tzinfo=None)  # 移除时区信息
                except:
                    return "N/A"
        elif isinstance(dt, datetime):
            dt_obj = dt
            if dt_obj.tzinfo:
                dt_obj = dt_obj.replace(tzinfo=None)  # 移除时区信息
        else:
            return "N/A"
        
        # 将 reference_time 转换为 datetime 对象
        ref_obj = None
        if isinstance(reference_time, str):
            for fmt in [
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%SZ",
            ]:
                try:
                    ref_obj = datetime.strptime(reference_time, fmt)
                    break
                except ValueError:
                    continue
            else:
                try:
                    ref_obj = datetime.fromisoformat(reference_time.replace('Z', '+00:00'))
                    if ref_obj.tzinfo:
                        ref_obj = ref_obj.replace(tzinfo=None)  # 移除时区信息
                except:
                    return "N/A"
        elif isinstance(reference_time, datetime):
            ref_obj = reference_time
            if ref_obj.tzinfo:
                ref_obj = ref_obj.replace(tzinfo=None)  # 移除时区信息
        else:
            return "N/A"
        
        # 直接计算时间差（参考时间 - 发布时间），不考虑时区
        time_diff = ref_obj - dt_obj
        
        # 如果发布时间在参考时间之后（不应该发生，但处理一下）
        if time_diff.total_seconds() < 0:
            time_diff = -time_diff
            prefix = "后"
        else:
            prefix = "前"
        
        total_seconds = int(time_diff.total_seconds())
        
        # 小于1分钟
        if total_seconds < 60:
            return "刚刚" if prefix == "前" else "即将"
        
        # 小于1小时
        minutes = total_seconds // 60
        if minutes < 60:
            return f"{minutes}分钟{prefix}"
        
        # 小于1天
        hours = total_seconds // 3600
        if hours < 24:
            return f"{hours}小时{prefix}"
        
        # 大于等于1天
        days = total_seconds // 86400
        if days < 30:
            return f"{days}天{prefix}"
        
        # 大于等于30天
        months = days // 30
        if months < 12:
            return f"{months}个月{prefix}"
        
        # 大于等于1年
        years = days // 365
        return f"{years}年{prefix}"
    
    except Exception as e:
        logger.warning(f"Failed to format relative time {dt} vs {reference_time}: {e}")
        return "N/A"


def format_datetime(dt, timezone: Optional[ZoneInfo] = None) -> str:
    """
    格式化时间显示，处理 datetime 对象或字符串，并转换为指定时区
    
    Args:
        dt: datetime 对象或字符串（UTC时间）
        timezone: 目标时区，如果为None则使用UTC时间
        
    Returns:
        格式化后的时间字符串（用户时区）
    """
    if dt is None:
        return "N/A"
    
    try:
        # 如果是字符串，尝试解析为UTC时间
        dt_obj = None
        if isinstance(dt, str):
            # 尝试多种格式
            for fmt in [
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M:%S.%f",
                "%Y-%m-%dT%H:%M:%SZ",
            ]:
                try:
                    dt_obj = datetime.strptime(dt, fmt)
                    # 假设是UTC时间
                    if dt_obj.tzinfo is None:
                        dt_obj = dt_obj.replace(tzinfo=dt_timezone.utc)
                    break
                except ValueError:
                    continue
            
            # 如果还是字符串，尝试直接转换
            if dt_obj is None and isinstance(dt, str):
                try:
                    dt_obj = datetime.fromisoformat(dt.replace('Z', '+00:00'))
                    if dt_obj.tzinfo is None:
                        dt_obj = dt_obj.replace(tzinfo=dt_timezone.utc)
                except:
                    return dt  # 返回原字符串
        elif isinstance(dt, datetime):
            dt_obj = dt
            # 如果没有时区信息，假设是UTC
            if dt_obj.tzinfo is None:
                dt_obj = dt_obj.replace(tzinfo=dt_timezone.utc)
        
        if dt_obj is None:
            return str(dt)
        
        # 转换时区
        if timezone:
            # 确保dt_obj有时区信息
            if dt_obj.tzinfo is None:
                dt_obj = dt_obj.replace(tzinfo=dt_timezone.utc)
            # 转换为目标时区
            dt_obj = dt_obj.astimezone(timezone)
        
        # 格式化时间
        return dt_obj.strftime("%Y-%m-%d %H:%M:%S")
    
    except Exception as e:
        logger.warning(f"Failed to format datetime {dt}: {e}")
        return str(dt)


def get_latest_publish_time(prices: List[Dict]) -> Optional[datetime]:
    """
    获取价格列表中最新的发布时间
    
    Args:
        prices: 价格列表
        
    Returns:
        最新的 crawl_time，如果所有价格都没有时间则返回 None
    """
    if not prices:
        return None
    
    latest_time = None
    
    for price_info in prices:
        crawl_time = price_info.get('crawl_time')
        if crawl_time is None:
            continue
        
        try:
            # 转换为 datetime 对象
            dt = None
            if isinstance(crawl_time, str):
                for fmt in [
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d %H:%M:%S.%f",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%dT%H:%M:%S.%f",
                    "%Y-%m-%dT%H:%M:%SZ",
                ]:
                    try:
                        dt = datetime.strptime(crawl_time, fmt)
                        # 假设是UTC时间
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=dt_timezone.utc)
                        break
                    except ValueError:
                        continue
                else:
                    try:
                        dt = datetime.fromisoformat(crawl_time.replace('Z', '+00:00'))
                        if dt.tzinfo is None:
                            dt = dt.replace(tzinfo=dt_timezone.utc)
                    except:
                        continue
            elif isinstance(crawl_time, datetime):
                dt = crawl_time
                # 如果没有时区信息，假设是UTC
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=dt_timezone.utc)
            else:
                continue
            
            if dt is None:
                continue
            
            if latest_time is None or dt > latest_time:
                latest_time = dt
        except Exception as e:
            logger.debug(f"Failed to parse crawl_time {crawl_time}: {e}")
            continue
    
    return latest_time


def get_gas_prices_within_5km(postcode: str, fuel_product: int = 1, session: Optional[Session] = None) -> List[Dict]:
    """
    获取指定邮编的gas价格，按价格从小到大排序（仅使用Regular类型，fuel_product=1）
    暂时不考虑距离限制，获取该邮编下所有加油站的价格
    
    Args:
        postcode: 邮编
        fuel_product: 油品类型（固定为1=regular_gas），默认1
        session: 数据库会话（可选），如果提供则使用该会话，否则创建新会话
        
    Returns:
        按价格从小到大排序的gas价格列表（不考虑距离）
    """
    # 固定使用Regular类型
    fuel_product = 1
    
    # 如果提供了session，使用它；否则创建新session
    use_external_session = session is not None
    if not use_external_session:
        session = Session(engine)
    
    try:
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
                ).order_by(desc(GasPrice.crawl_time)).limit(1)
            ).first()
            
            if latest_price and latest_price.cash_price:
                try:
                    price_float = float(latest_price.cash_price)
                    prices.append({
                        'station_name': station.name or "Unknown",
                        'address': station.address or "",
                        'distance': distance_float if distance_float is not None else 0.0,
                        'price': price_float,
                        'formatted_price': latest_price.cash_formatted_price or f"${price_float:.3f}",
                        'crawl_time': latest_price.crawl_time,
                        'posted_time': latest_price.posted_time  # 添加价格提交时间
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
    finally:
        # 如果使用的是外部session，不关闭；否则关闭session
        if not use_external_session:
            session.close()


def generate_multi_postcode_email_content(
    user_email: str, 
    postcode_data: Dict[str, List[Dict]], 
    postcode_label_map: Optional[Dict[str, str]] = None,
    fuel_product_name: str = "Regular Gas",
    session: Optional[Session] = None
) -> tuple[str, str]:
    """
    生成包含多个邮编的gas价格邮件内容
    
    Args:
        user_email: 用户邮箱
        postcode_data: 字典，key为邮编，value为该邮编的价格列表
        postcode_label_map: 字典，key为邮编，value为该邮编的label（标识），用于优先级排序
        fuel_product_name: 油品名称
        session: 数据库会话（可选），用于查询时区信息
        
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
        
        # 获取该邮编的时区
        postcode_timezone = get_timezone_by_postcode(postcode, session)
        
        # 获取该邮编的价格发布时间
        latest_publish_time = get_latest_publish_time(prices)
        publish_time_str = format_datetime(latest_publish_time, timezone=postcode_timezone) if latest_publish_time else "N/A"
        
        # 获取当前时间作为参考时间
        current_time_utc = datetime.utcnow()
        current_time_str = format_datetime(current_time_utc, timezone=postcode_timezone)
        
        text_content += f"\n{header_label}{fuel_product_name} Prices for {postcode}{label_info} (sorted by price, cheapest first):\n"
        text_content += f"当前时间: {current_time_str}\n\n"
        
        for idx, price_info in enumerate(prices[:10], 1):  # 每个邮编最多显示10个
            text_content += f"  {idx}. {price_info['station_name']}\n"
            text_content += f"     Price: {price_info['formatted_price']}\n"
            # 显示价格发布时间（相对时间 + 实际时间）
            posted_time = price_info.get('posted_time')
            if posted_time:
                # 计算相对时间（当前时间 - 发布时间）
                relative_time_str = format_relative_time(posted_time, current_time_utc)
                # 格式化实际发布时间
                posted_time_abs = format_datetime(posted_time, timezone=postcode_timezone) if posted_time else ""
                text_content += f"     发布时间: {relative_time_str} ({posted_time_abs})\n"
            if price_info['address']:
                text_content += f"     Address: {price_info['address']}\n"
            text_content += "\n"    
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
            .posted-time {{ color: #7f8c8d; font-size: 0.85em; }}
            .posted-time-absolute {{ color: #7f8c8d; font-size: 0.85em; }}
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
        
        # 获取该邮编的时区
        postcode_timezone = get_timezone_by_postcode(postcode, session)
        
        # 获取当前时间作为参考时间
        current_time_utc = datetime.utcnow()
        current_time_str = format_datetime(current_time_utc, timezone=postcode_timezone)
        
        html_content += f"""
        <div class="{section_class}">
            <h3>{header_icon}{fuel_product_name} Prices for {postcode}{label_html}</h3>
            <p>(sorted by price, cheapest first)</p>
            <p style="color: #7f8c8d; font-size: 0.9em; margin-top: 5px;">
                <strong>当前时间:</strong> {current_time_str}
            </p>
            <table>
                <tr>
                    <th>Rank</th>
                    <th>Station Name</th>
                    <th>Price</th>
                    <th>发布时间</th>
                    <th>Address</th>
                </tr>
        """
        
        for idx, price_info in enumerate(prices[:10], 1):  # 每个邮编最多显示10个
            posted_time = price_info.get('posted_time')
            # 显示相对时间 + 实际时间
            if posted_time:
                relative_time = format_relative_time(posted_time, current_time_utc)
                posted_time_abs = format_datetime(posted_time, timezone=postcode_timezone)
                posted_time_display = f'{relative_time} <span class="posted-time-absolute">({posted_time_abs})</span>'
            else:
                posted_time_display = "N/A"
            html_content += f"""
                <tr>
                    <td>{idx}</td>
                    <td>{price_info['station_name']}</td>
                    <td class="price">{price_info['formatted_price']}</td>
                    <td class="posted-time">{posted_time_display}</td>
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
                    # 获取该用户所有邮编的价格数据，并找出触发提醒的邮编
                    all_postcode_data = {}
                    alert_postcodes = []  # 触发提醒的邮编列表
                    lowest_price = None
                    alert_postcode = None
                    
                    for postcode in postcodes:
                        prices = get_gas_prices_within_5km(postcode, fuel_product=1, session=session)
                        if prices:
                            all_postcode_data[postcode] = prices
                            # 检查价格提醒
                            if check_price_alert(prices):
                                min_price = prices[0]['price']
                                if lowest_price is None or min_price < lowest_price:
                                    lowest_price = min_price
                                    alert_postcode = postcode
                                alert_postcodes.append(postcode)  # 记录触发提醒的邮编
                    
                    # 只有当价格低于阈值时才发送
                    if not alert_postcodes:
                        logger.debug(f"[Email] Skipping email to {user.email}: no price below threshold")
                        continue
                    
                    # 检查2小时内是否已发送过价格提醒邮件
                    if email_history_crud.check_recent_alert_sent(user_id, hours=2):
                        logger.info(
                            f"[Email] Skipping email to {user.email}: "
                            f"alert email sent within last 2 hours (cooldown)"
                        )
                        skipped_cooldown_count += 1
                        continue
                    
                    # 提醒邮件：只包含触发提醒的邮编数据
                    postcode_data = {postcode: all_postcode_data[postcode] for postcode in alert_postcodes}
                    
                    # 获取该用户的邮编 label 映射（只包含触发提醒的邮编）
                    postcode_label_map = {
                        postcode: user_postcode_label_map.get(user_id, {}).get(postcode, "")
                        for postcode in alert_postcodes
                    }
                    
                    # 生成聚合邮件内容（只包含触发提醒的邮编，按 label 优先级排序）
                    text_content, html_content = generate_multi_postcode_email_content(
                        user.email, postcode_data, postcode_label_map=postcode_label_map, 
                        fuel_product_name="Regular Gas", session=session
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
