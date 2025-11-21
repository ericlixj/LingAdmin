# spiders/gasbuddy_spider.py
import scrapy
import json
from app.core.logger import init_logger
import logging

init_logger()
logger = logging.getLogger(__name__)


class GasBuddySpider(scrapy.Spider):
    name = "gasbuddy_spider"

    custom_settings = {
        "DOWNLOAD_DELAY": 2.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 1,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 1,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 2.0,
        "AUTOTHROTTLE_MAX_DELAY": 10.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "RETRY_ENABLED": True,
        "RETRY_TIMES": 3,
        # 允许处理非 200 响应，以便在 parse 中处理错误
        "HTTPERROR_ALLOWED_CODES": [400, 401, 403, 404, 500],
    }

    # 基础 headers，会在 start_requests 中根据 postcode 动态更新 referer
    base_headers = {
        "accept": "*/*",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,fr;q=0.7",
        "apollo-require-preflight": "true",
        "content-type": "application/json",
        "origin": "https://www.gasbuddy.com",
        "priority": "u=1, i",
        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?1",  # 改为 ?1 匹配 curl
        "sec-ch-ua-platform": '"Android"',  # 改为 Android 匹配 curl
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    }
    
    # Cookies 从 curl 脚本中提取（可能需要定期更新）
    cookies = {
        "_loc_ne": "false",
        "_loc_dat": "false",
        "_gcl_au": "1.1.570712681.1763578212",
        "_gid": "GA1.2.1363992660.1763578212",
        "_ga": "GA1.2.8037252.1763578212",
    }

    # GraphQL query
    graphql_query = """
    query LocationBySearchTerm($brandId: Int, $cursor: String, $fuel: Int, $lang: String, $lat: Float, $lng: Float, $maxAge: Int, $search: String) {
      locationBySearchTerm(
        lat: $lat
        lng: $lng
        search: $search
        priority: "locality"
      ) {
        countryCode
        displayName
        latitude
        longitude
        regionCode
        stations(
          brandId: $brandId
          cursor: $cursor
          fuel: $fuel
          lat: $lat
          lng: $lng
          maxAge: $maxAge
          priority: "locality"
        ) {
          count
          cursor {
            next
            __typename
          }
          results {
            address {
              country
              line1
              line2
              locality
              postalCode
              region
              __typename
            }
            badges(lang: $lang) {
              badgeId
              callToAction
              campaignId
              clickTrackingUrl
              description
              detailsImageUrl
              detailsImpressionTrackingUrls
              imageUrl
              impressionTrackingUrls
              targetUrl
              title
              __typename
            }
            brands {
              brandId
              brandingType
              imageUrl
              name
              __typename
            }
            distance
            emergencyStatus {
              hasDiesel {
                nickname
                reportStatus
                updateDate
                __typename
              }
              hasGas {
                nickname
                reportStatus
                updateDate
                __typename
              }
              hasPower {
                nickname
                reportStatus
                updateDate
                __typename
              }
              __typename
            }
            enterprise
            fuels
            hasActiveOutage
            id
            isFuelmanSite
            name
            offers {
              discounts {
                grades
                highlight
                pwgbDiscount
                receiptDiscount
                __typename
              }
              highlight
              id
              types
              use
              __typename
            }
            payStatus {
              isPayAvailable
              __typename
            }
            prices {
              cash {
                nickname
                postedTime
                price
                formattedPrice
                __typename
              }
              credit {
                nickname
                postedTime
                price
                formattedPrice
                __typename
              }
              discount
              fuelProduct
              __typename
            }
            priceUnit
            ratingsCount
            starRating
            __typename
          }
          __typename
        }
        trends {
          areaName
          country
          today
          todayLow
          trend
          __typename
        }
        __typename
      }
    }
    """

    def __init__(self, postcode: str = None, **kwargs):
        super().__init__(**kwargs)
        self.postcode = postcode
        if not self.postcode:
            logger.error("postcode parameter is required")
            raise ValueError("postcode parameter is required")

    def start_requests(self):
        """Scrapy 启动入口"""
        try:
            url = "https://www.gasbuddy.com/graphql"
            
            # 格式化 postcode：添加空格（例如 V6Y1J5 -> V6Y 1J5）
            # 根据 curl 脚本，postcode 应该包含空格
            formatted_postcode = self.postcode.upper().strip()
            if len(formatted_postcode) >= 6 and formatted_postcode[3].isalpha() and ' ' not in formatted_postcode:
                # 如果是类似 V6Y1J5 的格式，转换为 V6Y 1J5
                formatted_postcode = f"{formatted_postcode[:3]} {formatted_postcode[3:]}"
            
            # Prepare GraphQL request payload
            # 根据 curl 脚本，需要包含 maxAge 参数
            payload = {
                "operationName": "LocationBySearchTerm",
                "variables": {
                    "fuel": 1,
                    "lang": "en",
                    "maxAge": 0,  # 添加 maxAge 参数
                    "search": formatted_postcode,  # 使用格式化后的 postcode
                },
                "query": self.graphql_query.strip()
            }

            # 更新 headers，完全匹配 curl 脚本
            headers = self.base_headers.copy()
            # 更新 referer 以匹配 curl 脚本的格式
            headers["referer"] = f"https://www.gasbuddy.com/home?search={formatted_postcode.replace(' ', '+')}&fuel=1&method=all&maxAge=0"
            # 添加 gbcsrf header（从 curl 脚本中提取，可能需要动态获取）
            # 注意：gbcsrf 可能需要从首次请求或 cookies 中获取
            # 这里先使用一个示例值，实际使用时可能需要动态获取
            headers["gbcsrf"] = "1.MqM4T/3F3ZAmpQgf"  # 从 curl 脚本中提取

            logger.info("=" * 80)
            logger.info(f"[Spider] Starting request for postcode: {self.postcode}")
            logger.info(f"[Spider] Formatted postcode: {formatted_postcode}")
            logger.info(f"[Spider] Request URL: {url}")
            logger.info(f"[Spider] Request Method: POST")
            logger.info(f"[Spider] Request Headers: {json.dumps(headers, indent=2)}")
            logger.info(f"[Spider] Request Payload:")
            logger.info(json.dumps(payload, indent=2))
            logger.info("=" * 80)

            # 创建请求，添加 cookies
            request = scrapy.Request(
                url=url,
                method="POST",
                headers=headers,
                body=json.dumps(payload),
                callback=self.parse,
                errback=self.handle_request_error,
                meta={"postcode": self.postcode, "formatted_postcode": formatted_postcode},
                cookies=self.cookies,  # 添加 cookies
            )
            
            yield request

        except Exception as e:
            logger.error(f"start_requests failed: {e}", exc_info=True)

    def handle_request_error(self, failure):
        """Scrapy 网络请求失败回调"""
        logger.error("=" * 80)
        logger.error(f"[Spider] Request failed!")
        logger.error(f"[Spider] Failure type: {type(failure.value)}")
        logger.error(f"[Spider] Failure value: {failure.value}")
        
        # 尝试获取响应信息
        if hasattr(failure.value, 'response'):
            response = failure.value.response
            logger.error(f"[Spider] Response status: {response.status}")
            logger.error(f"[Spider] Response URL: {response.url}")
            logger.error(f"[Spider] Response headers: {dict(response.headers)}")
            logger.error(f"[Spider] Response body (first 2000 chars):")
            logger.error(response.text[:2000] if hasattr(response, 'text') else str(response.body[:2000]))
        
        logger.error("=" * 80)
        logger.error(f"[Spider] Full failure traceback:", exc_info=True)
        self.crawler.stats.inc_value("gasbuddy/request_failed")

    def parse(self, response):
        """解析 GraphQL 响应"""
        try:
            postcode = response.meta.get("postcode", self.postcode)
            
            logger.info("=" * 80)
            logger.info(f"[Spider] Received response for postcode: {postcode}")
            logger.info(f"[Spider] Response Status: {response.status}")
            logger.info(f"[Spider] Response URL: {response.url}")
            logger.info(f"[Spider] Response Headers: {dict(response.headers)}")
            
            # 检查响应状态码
            if response.status != 200:
                logger.error(f"[Spider] Non-200 response status: {response.status}")
                logger.error(f"[Spider] Response body: {response.text[:2000]}")
                # 即使是非 200 响应，也尝试解析 JSON（可能包含错误信息）
                try:
                    error_data = response.json()
                    logger.error(f"[Spider] Error JSON: {json.dumps(error_data, indent=2)}")
                except:
                    pass
                logger.info("=" * 80)
                return  # 不处理非 200 响应
            
            # 打印响应体（前1000字符）
            response_text = response.text
            logger.info(f"[Spider] Response Body (first 1000 chars):")
            logger.info(response_text[:1000])
            if len(response_text) > 1000:
                logger.info(f"[Spider] ... (total {len(response_text)} chars, truncated)")
            logger.info("=" * 80)
            
            # 解析 JSON
            data = response.json()
            logger.info(f"[Spider] Successfully parsed JSON response")
            logger.info(f"[Spider] Response JSON structure:")
            logger.info(f"  - Has 'data': {'data' in data}")
            logger.info(f"  - Has 'errors': {'errors' in data}")
            if 'data' in data:
                logger.info(f"  - Data keys: {list(data['data'].keys()) if isinstance(data.get('data'), dict) else 'N/A'}")
            logger.info("=" * 80)
            
            # Check for errors in GraphQL response
            if "errors" in data:
                logger.error(f"[Spider] GraphQL errors for postcode {postcode}:")
                logger.error(json.dumps(data['errors'], indent=2))
                return
            
            # Extract location data
            location_data = data.get("data", {}).get("locationBySearchTerm")
            
            if not location_data:
                logger.warning(f"[Spider] No location data found for postcode: {postcode}")
                logger.warning(f"[Spider] Full response data: {json.dumps(data, indent=2)}")
                return
            
            logger.info(f"[Spider] Location data extracted:")
            logger.info(f"  - displayName: {location_data.get('displayName')}")
            logger.info(f"  - countryCode: {location_data.get('countryCode')}")
            logger.info(f"  - latitude: {location_data.get('latitude')}")
            logger.info(f"  - longitude: {location_data.get('longitude')}")
            logger.info(f"  - regionCode: {location_data.get('regionCode')}")
            
            stations = location_data.get("stations", {}).get("results", [])
            logger.info(f"[Spider] Found {len(stations)} stations")
            
            trends = location_data.get("trends")
            if trends:
                logger.info(f"[Spider] Trends data: {json.dumps(trends, indent=2)}")
            
            # Return the full response data
            result = {
                "postcode": postcode,
                "location": {
                    "countryCode": location_data.get("countryCode"),
                    "displayName": location_data.get("displayName"),
                    "latitude": location_data.get("latitude"),
                    "longitude": location_data.get("longitude"),
                    "regionCode": location_data.get("regionCode"),
                },
                "stations": stations,
                "trends": trends,
                "raw_data": data  # Include full response for reference
            }
            
            logger.info("=" * 80)
            logger.info(f"[Spider] Final result summary:")
            logger.info(f"  - Postcode: {result['postcode']}")
            logger.info(f"  - Stations count: {len(result['stations'])}")
            logger.info(f"  - Has trends: {result['trends'] is not None}")
            logger.info("=" * 80)
            
            # 打印前3个station的详细信息
            if stations:
                logger.info(f"[Spider] First 3 stations details:")
                for idx, station in enumerate(stations[:3], 1):
                    logger.info(f"  Station {idx}:")
                    logger.info(f"    - ID: {station.get('id')}")
                    logger.info(f"    - Name: {station.get('name')}")
                    logger.info(f"    - Distance: {station.get('distance')}")
                    logger.info(f"    - Prices count: {len(station.get('prices', []))}")
            
            yield result
            
        except json.JSONDecodeError as e:
            logger.error(f"[Spider] Failed to parse JSON response for postcode {self.postcode}: {e}", exc_info=True)
            logger.error(f"[Spider] Response body (first 1000 chars): {response.text[:1000]}")
        except Exception as e:
            logger.error(f"[Spider] Failed to parse response for postcode {self.postcode}: {e}", exc_info=True)

