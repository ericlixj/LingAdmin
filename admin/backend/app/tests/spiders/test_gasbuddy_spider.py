import json
import os
from unittest.mock import Mock, MagicMock, patch

# 在导入任何需要 settings 的模块之前，先设置环境变量
# 这样就不会触发 Settings 验证错误
os.environ.setdefault("PROJECT_NAME", "test")
os.environ.setdefault("POSTGRES_SERVER", "localhost")
os.environ.setdefault("POSTGRES_USER", "test")
os.environ.setdefault("POSTGRES_PASSWORD", "test")
os.environ.setdefault("POSTGRES_DB", "test")
os.environ.setdefault("CLICKHOUSE_HOST", "localhost")
os.environ.setdefault("CLICKHOUSE_USERNAME", "test")
os.environ.setdefault("CLICKHOUSE_PASSWORD", "test")
os.environ.setdefault("CLICKHOUSE_DATABASE", "test")
os.environ.setdefault("ES_SERVER", "localhost")
os.environ.setdefault("ES_PORT", "9200")
os.environ.setdefault("ES_USER", "test")
os.environ.setdefault("FIRST_SUPERUSER", "test@example.com")
os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "test")

import pytest
from scrapy.http import TextResponse, Request
from unittest.mock import patch

from app.spiders.gasbuddy_spider import GasBuddySpider


class TestGasBuddySpider:
    """测试 GasBuddySpider"""

    @pytest.fixture
    def spider(self):
        """创建 spider 实例"""
        # 创建模拟的 crawler 对象，避免需要安装 reactor
        mock_crawler = MagicMock()
        mock_crawler.stats = MagicMock()
        mock_crawler.stats.inc_value = MagicMock()
        return GasBuddySpider(postcode="v6y1j5", crawler=mock_crawler)

    def test_spider_initialization_with_postcode(self):
        """测试 spider 使用 postcode 参数初始化"""
        mock_crawler = MagicMock()
        mock_crawler.stats = MagicMock()
        mock_crawler.stats.inc_value = MagicMock()
        spider = GasBuddySpider(postcode="v6y1j5", crawler=mock_crawler)
        assert spider.postcode == "v6y1j5"
        assert spider.name == "gasbuddy_spider"

    def test_spider_initialization_without_postcode(self):
        """测试 spider 没有 postcode 参数时抛出异常"""
        mock_crawler = MagicMock()
        with pytest.raises(ValueError, match="postcode parameter is required"):
            GasBuddySpider(crawler=mock_crawler)

    def test_start_requests(self, spider):
        """测试 start_requests 方法生成正确的请求"""
        requests = list(spider.start_requests())
        assert len(requests) == 1
        
        request = requests[0]
        assert request.url == "https://www.gasbuddy.com/graphql"
        assert request.method == "POST"
        assert request.meta["postcode"] == "v6y1j5"
        
        # 验证请求体包含正确的 postcode
        body = json.loads(request.body)
        assert body["operationName"] == "LocationBySearchTerm"
        assert body["variables"]["search"] == "v6y1j5"
        assert body["variables"]["fuel"] == 1
        assert body["variables"]["lang"] == "en"

    def test_parse_successful_response(self, spider):
        """测试解析成功的 GraphQL 响应"""
        # 模拟成功的 GraphQL 响应
        mock_response_data = {
            "data": {
                "locationBySearchTerm": {
                    "countryCode": "CA",
                    "displayName": "Vancouver, BC",
                    "latitude": 49.2827,
                    "longitude": -123.1207,
                    "regionCode": "BC",
                    "stations": {
                        "results": [
                            {
                                "id": "12345",
                                "name": "Test Station",
                                "address": {
                                    "postalCode": "v6y1j5",
                                    "locality": "Vancouver",
                                    "region": "BC",
                                    "country": "CA"
                                },
                                "prices": [
                                    {
                                        "fuelProduct": 1,
                                        "cash": {
                                            "price": 1.50,
                                            "formattedPrice": "$1.50"
                                        }
                                    }
                                ]
                            }
                        ],
                        "count": 1
                    },
                    "trends": {
                        "areaName": "Vancouver",
                        "country": "CA",
                        "today": 1.50,
                        "todayLow": 1.45,
                        "trend": "up"
                    }
                }
            }
        }
        
        # 创建模拟响应 - 使用 TextResponse 支持 json() 方法
        request = Request("https://www.gasbuddy.com/graphql", meta={"postcode": "v6y1j5"})
        response = TextResponse(
            url="https://www.gasbuddy.com/graphql",
            body=json.dumps(mock_response_data).encode("utf-8"),
            request=request,
        )
        
        # 解析响应
        results = list(spider.parse(response))
        assert len(results) == 1
        
        result = results[0]
        assert result["postcode"] == "v6y1j5"
        assert result["location"]["countryCode"] == "CA"
        assert result["location"]["displayName"] == "Vancouver, BC"
        assert result["location"]["latitude"] == 49.2827
        assert result["location"]["longitude"] == -123.1207
        assert result["location"]["regionCode"] == "BC"
        assert len(result["stations"]) == 1
        assert result["stations"][0]["id"] == "12345"
        assert result["stations"][0]["name"] == "Test Station"
        assert result["trends"]["areaName"] == "Vancouver"
        assert "raw_data" in result

    def test_parse_response_with_errors(self, spider):
        """测试解析包含错误的 GraphQL 响应"""
        mock_response_data = {
            "errors": [
                {
                    "message": "Location not found",
                    "extensions": {"code": "NOT_FOUND"}
                }
            ]
        }
        
        request = Request("https://www.gasbuddy.com/graphql", meta={"postcode": "v6y1j5"})
        response = TextResponse(
            url="https://www.gasbuddy.com/graphql",
            body=json.dumps(mock_response_data).encode("utf-8"),
            request=request,
        )
        
        # 解析响应应该返回空结果
        results = list(spider.parse(response))
        assert len(results) == 0

    def test_parse_response_without_location_data(self, spider):
        """测试解析没有 location 数据的响应"""
        mock_response_data = {
            "data": {
                "locationBySearchTerm": None
            }
        }
        
        request = Request("https://www.gasbuddy.com/graphql", meta={"postcode": "v6y1j5"})
        response = TextResponse(
            url="https://www.gasbuddy.com/graphql",
            body=json.dumps(mock_response_data).encode("utf-8"),
            request=request,
        )
        
        # 解析响应应该返回空结果
        results = list(spider.parse(response))
        assert len(results) == 0

    def test_parse_invalid_json_response(self, spider):
        """测试解析无效的 JSON 响应"""
        request = Request("https://www.gasbuddy.com/graphql", meta={"postcode": "v6y1j5"})
        response = TextResponse(
            url="https://www.gasbuddy.com/graphql",
            body=b"Invalid JSON",
            request=request,
        )
        
        # 解析响应应该返回空结果（因为 JSON 解析失败）
        results = list(spider.parse(response))
        assert len(results) == 0

    def test_parse_response_with_empty_stations(self, spider):
        """测试解析没有加油站数据的响应"""
        mock_response_data = {
            "data": {
                "locationBySearchTerm": {
                    "countryCode": "CA",
                    "displayName": "Vancouver, BC",
                    "latitude": 49.2827,
                    "longitude": -123.1207,
                    "regionCode": "BC",
                    "stations": {
                        "results": [],
                        "count": 0
                    },
                    "trends": None
                }
            }
        }
        
        request = Request("https://www.gasbuddy.com/graphql", meta={"postcode": "v6y1j5"})
        response = TextResponse(
            url="https://www.gasbuddy.com/graphql",
            body=json.dumps(mock_response_data).encode("utf-8"),
            request=request,
        )
        
        results = list(spider.parse(response))
        assert len(results) == 1
        
        result = results[0]
        assert result["postcode"] == "v6y1j5"
        assert len(result["stations"]) == 0

    def test_handle_request_error(self, spider):
        """测试请求错误处理"""
        failure = Mock()
        failure.value = Exception("Network error")
        
        # 设置 mock 的返回值
        spider.crawler.stats.get_value.return_value = 1

        # 应该不会抛出异常
        spider.handle_request_error(failure)

        # 验证统计信息被更新（调用 inc_value）
        spider.crawler.stats.inc_value.assert_called_once_with("gasbuddy/request_failed")

    def test_custom_settings(self, spider):
        """测试自定义设置"""
        assert spider.custom_settings["DOWNLOAD_DELAY"] == 2.0
        assert spider.custom_settings["RANDOMIZE_DOWNLOAD_DELAY"] is True
        assert spider.custom_settings["CONCURRENT_REQUESTS"] == 1
        assert spider.custom_settings["RETRY_ENABLED"] is True
        assert spider.custom_settings["RETRY_TIMES"] == 3

    def test_headers(self, spider):
        """测试请求头"""
        assert "user-agent" in spider.headers
        assert "content-type" in spider.headers
        assert spider.headers["content-type"] == "application/json"
        assert "origin" in spider.headers
        assert spider.headers["origin"] == "https://www.gasbuddy.com"

