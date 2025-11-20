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
    }

    headers = {
        "accept": "*/*",
        "accept-language": "en,zh-CN;q=0.9,zh;q=0.8,fr;q=0.7",
        "apollo-require-preflight": "true",
        "content-type": "application/json",
        "origin": "https://www.gasbuddy.com",
        "priority": "u=1, i",
        "referer": "https://www.gasbuddy.com/home",
        "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
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
            
            # Prepare GraphQL request payload
            payload = {
                "operationName": "LocationBySearchTerm",
                "variables": {
                    "fuel": 1,
                    "lang": "en",
                    "search": self.postcode
                },
                "query": self.graphql_query.strip()
            }

            logger.info(f"Starting request for postcode: {self.postcode}")

            yield scrapy.Request(
                url=url,
                method="POST",
                headers=self.headers,
                body=json.dumps(payload),
                callback=self.parse,
                errback=self.handle_request_error,
                meta={"postcode": self.postcode}
            )

        except Exception as e:
            logger.error(f"start_requests failed: {e}", exc_info=True)

    def handle_request_error(self, failure):
        """Scrapy 网络请求失败回调"""
        logger.error(f"Request failed: {failure.value}", exc_info=True)
        self.crawler.stats.inc_value("gasbuddy/request_failed")

    def parse(self, response):
        """解析 GraphQL 响应"""
        try:
            data = response.json()
            postcode = response.meta.get("postcode", self.postcode)
            
            logger.info(f"Successfully fetched data for postcode: {postcode}")
            
            # Check for errors in GraphQL response
            if "errors" in data:
                logger.error(f"GraphQL errors for postcode {postcode}: {data['errors']}")
                return
            
            # Extract location data
            location_data = data.get("data", {}).get("locationBySearchTerm")
            
            if not location_data:
                logger.warning(f"No location data found for postcode: {postcode}")
                return
            
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
                "stations": location_data.get("stations", {}).get("results", []),
                "trends": location_data.get("trends"),
                "raw_data": data  # Include full response for reference
            }
            
            logger.info(f"Found {len(result['stations'])} stations for postcode: {postcode}")
            
            yield result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response for postcode {self.postcode}: {e}", exc_info=True)
            logger.debug(f"Response body: {response.text[:500]}")
        except Exception as e:
            logger.error(f"Failed to parse response for postcode {self.postcode}: {e}", exc_info=True)

