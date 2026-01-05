# spiders/fandom_wiki_spider.py
import scrapy
import re
from urllib.parse import urljoin, urlparse
from app.core.db import engine
from app.core.logger import init_logger
from app.crud.studySourceSection_crud import StudySourceSectionCRUD
from app.crud.studyKnowledgeNode_crud import StudyKnowledgeNodeCRUD
from app.crud.studyKnowledgeSourceSection_crud import StudyKnowledgeSourceSectionCRUD
from app.models.studySourceSection import StudySourceSection, StudySourceSectionCreate
from app.models.studyKnowledgeNode import StudyKnowledgeNode, StudyKnowledgeNodeCreate
from app.models.studyKnowledgeSourceSection import StudyKnowledgeSourceSection, StudyKnowledgeSourceSectionCreate
from sqlmodel import Session, select
import logging

init_logger()
logger = logging.getLogger(__name__)


class FandomWikiSpider(scrapy.Spider):
    name = "fandom_wiki_spider"
    
    # 来源ID，根据用户要求设置为730
    SOURCE_ID = 730
    
    custom_settings = {
        "DOWNLOAD_DELAY": 1.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 1,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 1,
        "AUTOTHROTTLE_ENABLED": True,
        "AUTOTHROTTLE_START_DELAY": 1.0,
        "AUTOTHROTTLE_MAX_DELAY": 5.0,
        "AUTOTHROTTLE_TARGET_CONCURRENCY": 1.0,
        "RETRY_ENABLED": True,
        "RETRY_TIMES": 3,
        "HTTPERROR_ALLOWED_CODES": [400, 401, 403, 404, 500],
        "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "DEFAULT_REQUEST_HEADERS": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        },
    }
    
    # 预定义的12个类别（因为页面可能需要JavaScript渲染）
    CATEGORIES = [
        {'name': 'Items', 'url_path': '/wiki/Items'},
        {'name': 'Entities', 'url_path': '/wiki/Entities'},
        {'name': 'Chests', 'url_path': '/wiki/Chests'},
        {'name': 'Badges', 'url_path': '/wiki/Badges'},
        {'name': 'Classes', 'url_path': '/wiki/Classes'},
        {'name': 'Crafting', 'url_path': '/wiki/Crafting'},
        {'name': 'Campfire', 'url_path': '/wiki/Campfire'},
        {'name': 'Locations', 'url_path': '/wiki/Locations'},
        {'name': 'Lore', 'url_path': '/wiki/Lore'},
        {'name': 'Update Log', 'url_path': '/wiki/Update_Log'},
        {'name': 'Tips And Tricks', 'url_path': '/wiki/Tips_And_Tricks'},
        {'name': 'Fishing', 'url_path': '/wiki/Fishing'},
    ]
    
    def __init__(self, user_id: int = 1, dept_id: int = 1, scrape_items_only: bool = True, dry_run: bool = False):
        super().__init__()
        self.user_id = user_id
        self.dept_id = dept_id
        self.scrape_items_only = scrape_items_only  # 是否只爬取Items类别
        self.dry_run = dry_run  # 是否只收集不保存
        self.category_sections = {}  # 存储类别名称到section_id的映射
        self.base_url = "https://99-nights-in-the-forest.fandom.com"
        self.all_items = []  # 收集所有item用于dry_run模式
        
    def start_requests(self):
        """开始请求，直接创建所有类别章节，然后爬取Items"""
        # 设置请求headers
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        }
        # 先创建所有类别的章节记录
        with Session(engine) as session:
            section_crud = StudySourceSectionCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
            
            for category in self.CATEGORIES:
                category_name = category['name']
                # 检查是否已存在该章节
                existing = session.exec(
                    select(StudySourceSection).where(
                        StudySourceSection.source_id == self.SOURCE_ID,
                        StudySourceSection.chapter == category_name,
                        StudySourceSection.deleted == False
                    )
                ).first()
                
                if not existing:
                    try:
                        # 创建新的章节记录
                        section_in = StudySourceSectionCreate(
                            source_id=self.SOURCE_ID,
                            chapter=category_name,
                            section="",
                            page_start=0,  # 设置默认值
                            page_end=0,    # 设置默认值
                            anchor_text=f"Fandom Wiki类别: {category_name}",
                            creator=str(self.user_id),
                            dept_id=self.dept_id
                        )
                        section_obj = section_crud.create(section_in)
                        self.category_sections[category_name] = section_obj.id
                        logger.info(f"创建章节: {category_name} (id: {section_obj.id})")
                    except Exception as e:
                        # 如果创建失败（可能是并发问题），再次查询
                        logger.warning(f"创建章节失败，可能是并发问题: {e}")
                        existing = session.exec(
                            select(StudySourceSection).where(
                                StudySourceSection.source_id == self.SOURCE_ID,
                                StudySourceSection.chapter == category_name,
                                StudySourceSection.deleted == False
                            )
                        ).first()
                        if existing:
                            self.category_sections[category_name] = existing.id
                            logger.info(f"使用已有章节: {category_name} (id: {existing.id})")
                        else:
                            logger.error(f"无法创建或找到章节: {category_name}")
                else:
                    self.category_sections[category_name] = existing.id
                    logger.info(f"使用已有章节: {category_name} (id: {existing.id})")
        
        # 如果只爬取Items，只请求Items页面
        if self.scrape_items_only:
            items_category = next((c for c in self.CATEGORIES if c['name'] == 'Items'), None)
            if items_category:
                url = urljoin(self.base_url, items_category['url_path'])
                logger.info(f"开始爬取Items类别: {url}")
                yield scrapy.Request(
                    url=url,
                    callback=self.parse_category_page,
                    meta={'category_name': items_category['name']},
                    headers=headers
                )
            else:
                logger.warning("未找到Items类别")
        else:
            # 爬取所有类别
            for category in self.CATEGORIES:
                url = urljoin(self.base_url, category['url_path'])
                yield scrapy.Request(
                    url=url,
                    callback=self.parse_category_page,
                    meta={'category_name': category['name']},
                    headers=headers
                )
    
    def parse_category_page(self, response):
        """解析类别页面，提取知识点"""
        category_name = response.meta.get('category_name', 'Unknown')
        logger.info(f"解析类别页面: {category_name} - {response.url}")
        
        section_id = self.category_sections.get(category_name)
        if not section_id:
            logger.warning(f"未找到类别 {category_name} 的章节ID，跳过")
            return
        
        # 确保响应内容是文本格式（HtmlResponse）
        # 如果response不是HtmlResponse，先转换为HtmlResponse
        from scrapy.http import HtmlResponse
        if not isinstance(response, HtmlResponse):
            try:
                response = HtmlResponse(url=response.url, body=response.body, encoding='utf-8')
            except Exception as e:
                logger.error(f"无法转换response为HtmlResponse: {e}")
                return
        
        # 获取响应文本内容
        try:
            body_text = response.text
        except:
            try:
                body_text = response.body.decode('utf-8', errors='ignore')
            except:
                logger.error("无法获取响应文本内容")
                return
        
        # 如果响应太小或不包含table，使用subprocess调用curl获取
        if len(body_text) < 50000 or '<table' not in body_text:
            logger.warning(f"Scrapy响应内容不完整 ({len(body_text)} 字符)，使用curl重新获取")
            import subprocess
            try:
                curl_cmd = [
                    'curl', '-s', '-L',
                    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--compressed',
                    response.url
                ]
                result = subprocess.run(curl_cmd, capture_output=True, text=False, timeout=30)
                if result.returncode == 0 and len(result.stdout) > 50000:
                    body_text = result.stdout.decode('utf-8', errors='ignore')
                    logger.info(f"使用curl获取到 {len(body_text)} 字符的内容")
                    
                    response = HtmlResponse(url=response.url, body=result.stdout, encoding='utf-8')
                else:
                    logger.warning(f"curl获取失败或内容仍然不完整 (返回码: {result.returncode}, 大小: {len(result.stdout)} 字节)")
            except Exception as e:
                logger.error(f"使用curl获取内容失败: {e}")
        
        logger.info(f"最终响应大小: {len(body_text)} 字符")
        
        # 如果类别是Items，需要处理二级类别
        if category_name == 'Items':
            # 查找一级类别（Tools, Weapons, Armor, Fuel, Blueprints, Anvil Parts等）
            primary_categories = ['Tools', 'Weapons', 'Armor', 'Fuel', 'Blueprints', 'Anvil Parts']
            
            # 查找tabs（一级类别）
            tabs = response.css('.wds-tabs__tab, .wds-tab')
            logger.info(f"找到 {len(tabs)} 个tabs")
            
            # 对于每个一级类别，查找其下的二级类别和items
            for tab in tabs:
                tab_text = ' '.join(tab.css('::text').getall()).strip()
                tab_id = tab.css('::attr(id)').get() or tab.css('::attr(data-tab)').get() or tab.css('::attr(data-tab-id)').get()
                
                # 检查是否是我们需要处理的一级类别
                if any(primary_cat.lower() in tab_text.lower() for primary_cat in primary_categories):
                    logger.info(f"处理一级类别: {tab_text} (tab_id: {tab_id})")
                    
                    # 尝试多种方式查找tab内容
                    tab_content = None
                    
                    # 方法1: 通过data-tab属性查找
                    if tab_id:
                        tab_content = response.css(f'[data-tab="{tab_id}"], [id="{tab_id}"]')
                    
                    # 方法2: 通过aria-controls查找
                    if (not tab_content or len(tab_content) == 0):
                        aria_controls = tab.css('::attr(aria-controls)').get()
                        if aria_controls:
                            tab_content = response.css(f'#{aria_controls}, [id="{aria_controls}"]')
                    
                    # 方法3: 查找所有.wds-tab__content，然后通过位置匹配
                    if (not tab_content or len(tab_content) == 0):
                        all_tab_contents = response.css('.wds-tab__content, .tab-content')
                        tab_index = list(tabs).index(tab) if tab in tabs else -1
                        if tab_index >= 0 and tab_index < len(all_tab_contents):
                            tab_content = [all_tab_contents[tab_index]]
                    
                    # 方法4: 如果还是找不到，使用整个response（因为tabs可能是动态的）
                    if (not tab_content or len(tab_content) == 0):
                        logger.warning(f"未找到 {tab_text} 的tab内容，使用整个页面内容")
                        tab_content = response
                    
                    # 在tab内容中查找二级类别和items
                    self._parse_subcategories_and_items(response, tab_content, tab_text, section_id)
            
            # 对于非一级类别的其他tabs，直接提取items
            for tab in tabs:
                tab_text = ' '.join(tab.css('::text').getall()).strip()
                if not any(primary_cat.lower() in tab_text.lower() for primary_cat in primary_categories):
                    logger.info(f"处理其他类别: {tab_text}")
                    tab_id = tab.css('::attr(id)').get() or tab.css('::attr(data-tab)').get()
                    tab_content_selector = f'[data-tab="{tab_id}"], .wds-tab__content'
                    tab_content = response.css(tab_content_selector)
                    if tab_content:
                        self._parse_items_from_tables(response, tab_text, section_id)
        else:
            # 对于非Items类别，直接提取items
            self._parse_items_from_tables(response, category_name, section_id)
    
    def _parse_subcategories_and_items(self, response, tab_content, primary_category, section_id):
        """解析一级类别下的二级类别和items"""
        logger.info(f"解析一级类别 {primary_category} 下的二级类别和items")
        
        # 使用lxml直接解析HTML，更可靠地查找二级类别
        try:
            from lxml import html
            try:
                html_content = response.text
            except:
                html_content = response.body.decode('utf-8', errors='ignore')
            
            doc = html.fromstring(html_content.encode('utf-8'))
            
            # 查找所有表格
            all_tables = doc.xpath('//table')
            logger.info(f"在整个页面中找到 {len(all_tables)} 个表格")
            
            # 查找所有可能的二级类别标题（h2, h3, h4）
            all_headers = doc.xpath('//h2 | //h3 | //h4')
            logger.info(f"找到 {len(all_headers)} 个可能的标题")
            
            # 构建标题到表格的映射
            # 对于每个标题，查找它后面的表格（直到下一个同级或更高级标题）
            processed_tables = set()
            
            for i, header in enumerate(all_headers):
                header_text = header.text_content().strip() if header.text_content() else ''
                if not header_text or len(header_text) < 2:
                    continue
                
                # 检查标题是否可能是二级类别（不是一级类别）
                header_lower = header_text.lower()
                if any(pc.lower() in header_lower for pc in ['Tools', 'Weapons', 'Armor', 'Fuel', 'Blueprints', 'Anvil Parts']):
                    # 这是一级类别，跳过
                    continue
                
                logger.info(f"找到可能的二级类别标题: {header_text}")
                
                # 查找该标题后的所有表格（直到下一个同级或更高级标题）
                following_tables = []
                current = header.getnext()
                header_level = int(header.tag[1]) if header.tag.startswith('h') else 0
                
                while current is not None:
                    # 如果遇到同级或更高级的标题，停止
                    if current.tag.startswith('h'):
                        current_level = int(current.tag[1])
                        if current_level <= header_level:
                            break
                    
                    # 如果是表格，添加到列表
                    if current.tag == 'table':
                        if id(current) not in processed_tables:
                            following_tables.append(current)
                            processed_tables.add(id(current))
                    
                    current = current.getnext()
                
                # 如果没有找到后续表格，尝试查找header父元素下的表格
                if len(following_tables) == 0:
                    parent = header.getparent()
                    if parent is not None:
                        tables_in_parent = parent.xpath('.//table')
                        for table in tables_in_parent:
                            if id(table) not in processed_tables:
                                following_tables.append(table)
                                processed_tables.add(id(table))
                
                # 处理找到的表格
                for table in following_tables:
                    items = self._extract_items_from_table_lxml(table, response)
                    if items:
                        logger.info(f"从二级类别 '{header_text}' 中提取了 {len(items)} 个items")
                        self._save_knowledge_items(items, section_id)
            
            # 处理没有明确标题的表格（可能是直接在一级类别下的表格）
            for table in all_tables:
                if id(table) not in processed_tables:
                    # 查找表格前的标题
                    prev = table.getprevious()
                    subcategory_name = f"{primary_category} - Unnamed"
                    
                    # 向上查找最近的标题
                    while prev is not None:
                        if prev.tag.startswith('h'):
                            subcategory_name = prev.text_content().strip() if prev.text_content() else subcategory_name
                            break
                        prev = prev.getprevious()
                    
                    items = self._extract_items_from_table_lxml(table, response)
                    if items:
                        logger.info(f"从二级类别 '{subcategory_name}' 中提取了 {len(items)} 个items")
                        self._save_knowledge_items(items, section_id)
                        processed_tables.add(id(table))
                        
        except Exception as e:
            logger.error(f"解析二级类别失败: {e}", exc_info=True)
            # 如果lxml解析失败，回退到原有方法
            logger.warning("回退到原有方法：直接提取所有表格")
            self._parse_items_from_tables(response, primary_category, section_id)
    
    def _parse_items_from_tables(self, response, category_name, section_id):
        """从表格中提取items（原有逻辑）"""
        knowledge_items = []
        
        # 查找所有表格
        tables = response.css('table')
        logger.debug(f"CSS选择器找到 {len(tables)} 个表格")
        
        # 如果CSS没找到，尝试XPath
        if len(tables) == 0:
            tables = response.xpath('//table')
            logger.debug(f"XPath找到 {len(tables)} 个表格")
        
        # 如果CSS/XPath没找到表格，使用lxml直接解析
        if len(tables) == 0:
            try:
                from lxml import html
                try:
                    html_content = response.text
                except:
                    html_content = response.body.decode('utf-8', errors='ignore')
                
                doc = html.fromstring(html_content.encode('utf-8'))
                tables = doc.xpath('//table')
                logger.debug(f"lxml找到 {len(tables)} 个表格")
                
                for table in tables:
                    items = self._extract_items_from_table_lxml(table, response)
                    knowledge_items.extend(items)
            except Exception as e:
                logger.error(f"lxml解析失败: {e}")
        else:
            # 使用Scrapy的CSS选择器提取
            for table in tables:
                items = self._extract_items_from_table(table, response)
                knowledge_items.extend(items)
        
        logger.info(f"在类别 {category_name} 中找到 {len(knowledge_items)} 个知识点")
        self._save_knowledge_items(knowledge_items, section_id)
    
    def _extract_items_from_table(self, table, response):
        """从表格中提取items（Scrapy CSS选择器）"""
        items = []
        rows = table.css('tr')
        for row in rows[1:]:  # 跳过表头
            cells = row.css('td')
            if len(cells) == 0:
                continue
            
            item = self._extract_item_from_row(cells, response)
            if item:
                items.append(item)
        return items
    
    def _extract_items_from_table_lxml(self, table, response):
        """从表格中提取items（lxml）"""
        items = []
        rows = table.xpath('.//tr')
        
        # 查找表头，确定Items列的位置
        header_row = rows[0] if len(rows) > 0 else None
        items_column_index = 0  # 默认第一列
        
        if header_row:
            header_cells = header_row.xpath('.//th | .//td')
            for idx, header_cell in enumerate(header_cells):
                header_text = header_cell.text_content().strip().lower() if header_cell.text_content() else ''
                if 'item' in header_text:
                    items_column_index = idx
                    logger.debug(f"找到Items列，索引: {items_column_index}")
                    break
        
        for row in rows[1:]:  # 跳过表头
            cells = row.xpath('.//td')
            if len(cells) == 0:
                continue
            
            # 确保有足够的列
            if items_column_index < len(cells):
                item = self._extract_item_from_row_lxml(cells, response, items_column_index)
                if item:
                    items.append(item)
        return items
    
    def _extract_item_from_row(self, cells, response, items_column_index=0):
        """从表格行中提取item信息（Scrapy CSS）"""
        # 使用指定的Items列索引
        if items_column_index >= len(cells):
            return None
        
        item_cell = cells[items_column_index]
        
        # 根据实际HTML结构，item名称在<center>标签内
        # 例如: <center>Old Sack</center>
        name = None
        
        # 方法1: 从<center>标签中提取名称（这是主要方法）
        center_tag = item_cell.css('center')
        if center_tag:
            name = ' '.join(center_tag.css('::text').getall()).strip()
        
        # 方法2: 如果<center>不存在，尝试从图片的alt属性获取
        if not name or not name.strip():
            img = item_cell.css('img')
            if img:
                name = img[0].css('::attr(alt)').get()
        
        # 方法3: 如果还是没有，尝试从链接的title属性获取
        if not name or not name.strip():
            name_link = item_cell.css('a')
            if name_link:
                name = name_link.css('::attr(title)').get()
        
        # 方法4: 如果还是没有，尝试从链接文本获取
        if not name or not name.strip():
            name_link = item_cell.css('a')
            if name_link:
                name_parts = name_link.css('::text').getall()
                name = ' '.join([part.strip() for part in name_parts if part.strip()])
        
        if not name or not name.strip():
            return None
        
        # 清理名称：移除多余的空白字符
        name = ' '.join(name.split())
        
        # 获取链接（用于生成URL，虽然链接可能指向类别页面）
        name_link = item_cell.css('a')
        href = name_link.css('::attr(href)').get() if name_link else None
        
        # 如果没有href，使用名称生成URL
        if not href:
            href = f"/wiki/{name.replace(' ', '_')}"
        
        # 排除一些明显不是item的链接
        exclude_patterns = ['category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                          'main_page', 'discuss', 'history', 'edit', 'items', '99_nights_in_the_forest']
        href_lower = href.lower()
        if any(exclude in href_lower for exclude in exclude_patterns):
            return None
        
        # 提取图片（从Items列的img标签中）
        img = item_cell.css('img')
        image_url = None
        if img:
            img_src = (img[0].css('::attr(data-src)').get() or
                      img[0].css('::attr(src)').get() or
                      img[0].css('::attr(data-image-key)').get())
            
            if img_src:
                if 'data:image' in img_src:
                    img_key = img[0].css('::attr(data-image-key)').get()
                    if img_key:
                        img_src = f"https://static.wikia.nocookie.net/99-nights-in-the-forest/images/{img_key}"
                
                if img_src and 'data:image' not in img_src:
                    if not img_src.startswith('http'):
                        image_url = urljoin(self.base_url, img_src)
                    else:
                        image_url = img_src
        
        # 提取描述（从其他列中，跳过Items列）
        description_parts = []
        for idx, cell in enumerate(cells):
            if idx == items_column_index:
                continue  # 跳过Items列
            cell_text = ' '.join(cell.css('::text').getall())
            if cell_text.strip():
                description_parts.append(cell_text.strip())
        
        description = ' | '.join(description_parts) if description_parts else ""
        
        # 规范化URL（使用名称生成item的wiki页面URL）
        if href and not href.endswith('/wiki/Sacks'):  # 如果href不是类别页面
            if href.startswith('/'):
                full_url = urljoin(self.base_url, href)
            elif href.startswith('http'):
                full_url = href
            else:
                full_url = urljoin(response.url, href)
        else:
            # 使用名称生成item的wiki页面URL
            item_url_path = f"/wiki/{name.replace(' ', '_')}"
            full_url = urljoin(self.base_url, item_url_path)
        
        return {
            'name': name,
            'url': full_url,
            'image_url': image_url,
            'description': description
        }
    
    def _extract_item_from_row_lxml(self, cells, response, items_column_index=0):
        """从表格行中提取item信息（lxml）"""
        # 使用指定的Items列索引
        if items_column_index >= len(cells):
            return None
        
        item_cell = cells[items_column_index]
        
        # 根据实际HTML结构，item名称在<center>标签内
        # 例如: <center>Old Sack</center>
        name = None
        
        # 方法1: 从<center>标签中提取名称（这是主要方法）
        center_tags = item_cell.xpath('.//center')
        if len(center_tags) > 0:
            name = center_tags[0].text_content().strip() if center_tags[0].text_content() else ''
        
        # 方法2: 如果<center>不存在，尝试从图片的alt属性获取
        if not name or not name.strip():
            imgs = item_cell.xpath('.//img')
            if len(imgs) > 0:
                name = imgs[0].get('alt', '').strip()
        
        # 方法3: 如果还是没有，尝试从链接的title属性获取
        if not name or not name.strip():
            name_links = item_cell.xpath('.//a')
            if len(name_links) > 0:
                name = name_links[0].get('title', '').strip()
        
        # 方法4: 如果还是没有，尝试从链接文本获取
        if not name or not name.strip():
            name_links = item_cell.xpath('.//a')
            if len(name_links) > 0:
                name = name_links[0].text_content().strip() if name_links[0].text_content() else ''
        
        if not name or not name.strip():
            return None
        
        # 清理名称：移除多余的空白字符
        name = ' '.join(name.split())
        
        # 获取链接（用于生成URL，虽然链接可能指向类别页面）
        name_links = item_cell.xpath('.//a')
        href = name_links[0].get('href', '') if len(name_links) > 0 else ''
        
        # 如果没有href，使用名称生成URL
        if not href:
            href = f"/wiki/{name.replace(' ', '_')}"
        
        # 排除一些明显不是item的链接
        exclude_patterns = ['category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                          'main_page', 'discuss', 'history', 'edit', 'items', '99_nights_in_the_forest']
        href_lower = href.lower()
        if any(exclude in href_lower for exclude in exclude_patterns):
            return None
        
        # 提取图片（从Items列的img标签中）
        imgs = item_cell.xpath('.//img')
        image_url = None
        if len(imgs) > 0:
            img = imgs[0]
            img_src = img.get('data-src') or img.get('src') or img.get('data-image-key')
            if img_src:
                if 'data:image' in img_src:
                    img_key = img.get('data-image-key')
                    if img_key:
                        img_src = f"https://static.wikia.nocookie.net/99-nights-in-the-forest/images/{img_key}"
                if img_src and 'data:image' not in img_src:
                    if not img_src.startswith('http'):
                        image_url = urljoin(self.base_url, img_src)
                    else:
                        image_url = img_src
        
        # 提取描述（从其他列中，跳过Items列）
        description_parts = []
        for idx, cell in enumerate(cells):
            if idx == items_column_index:
                continue  # 跳过Items列
            cell_text = cell.text_content().strip()
            if cell_text:
                description_parts.append(cell_text)
        
        description = ' | '.join(description_parts) if description_parts else ""
        
        # 规范化URL（使用名称生成item的wiki页面URL）
        if href and not href.endswith('/wiki/Sacks'):  # 如果href不是类别页面
            if href.startswith('/'):
                full_url = urljoin(self.base_url, href)
            elif href.startswith('http'):
                full_url = href
            else:
                full_url = urljoin(response.url, href)
        else:
            # 使用名称生成item的wiki页面URL
            item_url_path = f"/wiki/{name.replace(' ', '_')}"
            full_url = urljoin(self.base_url, item_url_path)
        
        return {
            'name': name,
            'url': full_url,
            'image_url': image_url,
            'description': description
        }
    
    def _save_knowledge_items(self, knowledge_items, section_id):
        """保存知识点到数据库"""
        # 如果是dry_run模式，只收集不保存
        if self.dry_run:
            for item in knowledge_items:
                self.all_items.append({
                    'name': item.get('name', 'N/A'),
                    'url': item.get('url', 'N/A'),
                    'image_url': item.get('image_url', 'N/A'),
                    'description': item.get('description', 'N/A')[:100]  # 只保留前100字符
                })
            logger.info(f"[Dry Run] 收集了 {len(knowledge_items)} 个item，总计: {len(self.all_items)} 个")
            return
        
        # 直接从表格中提取的信息创建知识点，不需要访问详情页面
        seen_codes = set()  # 用于在当前批次中去重
        
        logger.info("=" * 80)
        logger.info(f"开始保存 {len(knowledge_items)} 个知识点")
        logger.info("=" * 80)
        
        for idx, item in enumerate(knowledge_items, 1):
            # 打印item详细信息
            logger.info(f"\n[Item {idx}/{len(knowledge_items)}]")
            logger.info(f"  名称: {item.get('name', 'N/A')}")
            logger.info(f"  URL: {item.get('url', 'N/A')}")
            logger.info(f"  图片: {item.get('image_url', 'N/A')}")
            logger.info(f"  描述: {item.get('description', 'N/A')[:100]}...")  # 只显示前100个字符
            
            # 生成知识点代码（使用URL的最后一个部分）
            url_path = urlparse(item['url']).path
            code = url_path.split('/')[-1] if url_path else item['name'].lower().replace(' ', '_').replace('-', '_')
            
            # 如果code为空或无效，使用名称生成code
            if not code or code == 'wiki' or code == 'items':
                code = item['name'].lower().replace(' ', '_').replace('-', '_').replace("'", '').replace('"', '')
            
            logger.info(f"  生成的code: {code}")
            
            # 在当前批次中去重
            if code in seen_codes:
                logger.warning(f"  ⚠️  跳过重复的code: {code} (名称: {item['name']})")
                continue
            seen_codes.add(code)
            
            # 保存到数据库
            try:
                with Session(engine) as session:
                    knowledge_crud = StudyKnowledgeNodeCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
                    
                    # 检查是否已存在（优先根据名称比对）
                    existing = session.exec(
                        select(StudyKnowledgeNode).where(
                            StudyKnowledgeNode.title == item['name'],
                            StudyKnowledgeNode.deleted == False
                        )
                    ).first()
                    
                    # 如果名称不存在，再检查code（避免code冲突）
                    if not existing:
                        existing = session.exec(
                            select(StudyKnowledgeNode).where(
                                StudyKnowledgeNode.code == code,
                                StudyKnowledgeNode.deleted == False
                            )
                        ).first()
                        if existing:
                            logger.warning(f"  ⚠️  发现code冲突: code={code} 已存在，但名称不同 (已存在: {existing.title}, 新名称: {item['name']})")
                            # 如果code已存在但名称不同，仍然使用已存在的记录（避免code冲突）
                            logger.info(f"  ℹ️  使用已存在的记录 (id: {existing.id}, code: {existing.code})")
                    
                    if not existing:
                        knowledge_in = StudyKnowledgeNodeCreate(
                            code=code,
                            title=item['name'],
                            description=item.get('description', '')[:9999] if item.get('description') else "",  # 限制长度
                            importance="normal",
                            image_url=item.get('image_url') or "",
                            exam_id=6,  # 设置exam_id=6
                            creator=str(self.user_id),
                            dept_id=self.dept_id
                        )
                        knowledge_obj = knowledge_crud.create(knowledge_in)
                        logger.info(f"  ✅ 创建新知识点: {item['name']}")
                        logger.info(f"     - ID: {knowledge_obj.id}")
                        logger.info(f"     - Code: {code}")
                        logger.info(f"     - 标题: {knowledge_obj.title}")
                        logger.info(f"     - 描述长度: {len(knowledge_obj.description)} 字符")
                        logger.info(f"     - 图片URL: {knowledge_obj.image_url or '无'}")
                        
                        # 创建知识点与章节的关联（source_section_id=730）
                        link_crud = StudyKnowledgeSourceSectionCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
                        # 检查关联是否已存在
                        existing_link = session.exec(
                            select(StudyKnowledgeSourceSection).where(
                                StudyKnowledgeSourceSection.knowledge_node_id == knowledge_obj.id,
                                StudyKnowledgeSourceSection.source_section_id == 730,
                                StudyKnowledgeSourceSection.deleted == False
                            )
                        ).first()
                        
                        if not existing_link:
                            link_in = StudyKnowledgeSourceSectionCreate(
                                knowledge_node_id=knowledge_obj.id,
                                source_section_id=730,
                                creator=str(self.user_id),
                                dept_id=self.dept_id
                            )
                            link_obj = link_crud.create(link_in)
                            logger.info(f"创建知识点关联: {item['name']} -> source_section_id=730 (link_id: {link_obj.id})")
                        else:
                            logger.info(f"知识点关联已存在: {item['name']} -> source_section_id=730")
                    else:
                        logger.info(f"  ⏭️  知识点已存在: {item['name']} (code: {code}, id: {existing.id})")
                        
                        # 即使知识点已存在，也检查并创建关联
                        link_crud = StudyKnowledgeSourceSectionCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
                        existing_link = session.exec(
                            select(StudyKnowledgeSourceSection).where(
                                StudyKnowledgeSourceSection.knowledge_node_id == existing.id,
                                StudyKnowledgeSourceSection.source_section_id == 730,
                                StudyKnowledgeSourceSection.deleted == False
                            )
                        ).first()
                        
                        if not existing_link:
                            link_in = StudyKnowledgeSourceSectionCreate(
                                knowledge_node_id=existing.id,
                                source_section_id=730,
                                creator=str(self.user_id),
                                dept_id=self.dept_id
                            )
                            link_obj = link_crud.create(link_in)
                            logger.info(f"创建知识点关联: {item['name']} -> source_section_id=730 (link_id: {link_obj.id})")
            except Exception as e:
                logger.error(f"保存知识点失败: {item['name']} - {str(e)}")
                # 不抛出异常，继续处理下一个
    
    def parse_knowledge_detail(self, response):
        """解析知识点详情页面"""
        category_name = response.meta.get('category_name', 'Unknown')
        section_id = response.meta.get('section_id')
        item_name = response.meta.get('item_name', '')
        item_image_url = response.meta.get('item_image_url')
        item_description = response.meta.get('item_description', '')
        
        logger.info(f"解析知识点详情: {item_name} - {response.url}")
        
        # 提取完整描述
        # Fandom Wiki的内容通常在 .mw-parser-output 中
        description_parts = response.css('.mw-parser-output p::text, .mw-parser-output li::text, p::text, li::text').getall()
        full_description = ' '.join([d.strip() for d in description_parts if d.strip()])
        
        # 如果没有从详情页获取到描述，使用之前获取的
        if not full_description:
            full_description = item_description
        
        # 提取图片（优先使用详情页的图片）
        images = response.css('.mw-parser-output img, .infobox img, .image img, img')
        image_url = item_image_url
        if images:
            img_src = images[0].css('::attr(src)').get() or images[0].css('::attr(data-src)').get()
            if img_src:
                if not img_src.startswith('http'):
                    image_url = urljoin(self.base_url, img_src)
                else:
                    image_url = img_src
        
        # 生成知识点代码（使用URL的最后一个部分）
        url_path = urlparse(response.url).path
        code = url_path.split('/')[-1] if url_path else item_name.lower().replace(' ', '_')
        
        # 保存到数据库
        try:
            with Session(engine) as session:
                knowledge_crud = StudyKnowledgeNodeCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
                
                # 检查是否已存在（根据code）
                existing = session.exec(
                    select(StudyKnowledgeNode).where(
                        StudyKnowledgeNode.code == code,
                        StudyKnowledgeNode.deleted == False
                    )
                ).first()
                
                if not existing:
                    knowledge_in = StudyKnowledgeNodeCreate(
                        code=code,
                        title=item_name,
                        description=full_description[:9999] if full_description else "",  # 限制长度
                        importance="normal",
                        image_url=image_url or "",
                        creator=str(self.user_id),
                        dept_id=self.dept_id
                    )
                    knowledge_obj = knowledge_crud.create(knowledge_in)
                    logger.info(f"创建知识点: {item_name} (id: {knowledge_obj.id}, code: {code})")
                else:
                    logger.info(f"知识点已存在: {item_name} (code: {code})")
        except Exception as e:
            logger.error(f"保存知识点失败: {item_name} - {str(e)}")
            # 不抛出异常，继续处理下一个
    
    def closed(self, reason):
        """爬虫关闭时调用"""
        if self.dry_run and self.all_items:
            # 去重（根据名称）
            seen_names = set()
            unique_items = []
            for item in self.all_items:
                name = item['name']
                if name not in seen_names:
                    seen_names.add(name)
                    unique_items.append(item)
            
            # 按名称排序
            unique_items.sort(key=lambda x: x['name'])
            
            # 打印详细信息
            logger.info("=" * 80)
            logger.info("所有Item详细信息:")
            logger.info("=" * 80)
            logger.info(f"\n总计找到 {len(unique_items)} 个唯一的item:\n")
            for idx, item in enumerate(unique_items, 1):
                logger.info(f"{idx:4d}. {item['name']}")
                logger.info(f"      URL: {item['url']}")
                logger.info(f"      图片: {item['image_url']}")
                logger.info(f"      描述: {item['description']}")
                logger.info("")
            
            # 单独打印所有item名称列表（整合）
            logger.info("=" * 80)
            logger.info("所有Item名称列表（整合）:")
            logger.info("=" * 80)
            logger.info(f"\n总计: {len(unique_items)} 个唯一的item\n")
            
            # 打印名称列表（每行一个）
            names_only = [item['name'] for item in unique_items]
            for name in names_only:
                logger.info(name)
            
            logger.info("")
            logger.info("=" * 80)
            logger.info("名称列表（逗号分隔）:")
            logger.info("=" * 80)
            logger.info(", ".join(names_only))
            logger.info("")
            logger.info("=" * 80)
            logger.info(f"总计: {len(unique_items)} 个唯一的item")
            logger.info("=" * 80)
        
        super().closed(reason)