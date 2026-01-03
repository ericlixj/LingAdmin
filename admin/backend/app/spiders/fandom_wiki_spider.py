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
    
    def __init__(self, user_id: int = 1, dept_id: int = 1, scrape_items_only: bool = True):
        super().__init__()
        self.user_id = user_id
        self.dept_id = dept_id
        self.scrape_items_only = scrape_items_only  # 是否只爬取Items类别
        self.category_sections = {}  # 存储类别名称到section_id的映射
        self.base_url = "https://99-nights-in-the-forest.fandom.com"
        
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
        
        # 如果Scrapy的响应内容不完整，使用requests直接获取
        try:
            body_text = response.text
        except:
            body_text = response.body.decode('utf-8', errors='ignore')
        
        # 如果响应太小或不包含table，使用subprocess调用curl获取
        if len(body_text) < 50000 or '<table' not in body_text:
            logger.warning(f"Scrapy响应内容不完整 ({len(body_text)} 字符)，使用curl重新获取")
            import subprocess
            try:
                # 使用curl获取完整内容（不使用gzip压缩，避免解压问题）
                curl_cmd = [
                    'curl', '-s', '-L',  # -L 跟随重定向
                    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--compressed',  # 让curl自动处理压缩
                    response.url
                ]
                result = subprocess.run(curl_cmd, capture_output=True, text=False, timeout=30)
                if result.returncode == 0 and len(result.stdout) > 50000:
                    body_text = result.stdout.decode('utf-8', errors='ignore')
                    logger.info(f"使用curl获取到 {len(body_text)} 字符的内容")
                    
                    # 重新创建HtmlResponse
                    from scrapy.http import HtmlResponse
                    response = HtmlResponse(url=response.url, body=result.stdout, encoding='utf-8')
                else:
                    logger.warning(f"curl获取失败或内容仍然不完整 (返回码: {result.returncode}, 大小: {len(result.stdout)} 字节)")
            except Exception as e:
                logger.error(f"使用curl获取内容失败: {e}")
        
        logger.info(f"最终响应大小: {len(body_text)} 字符")
        
        # 查找页面中的所有知识点条目
        # 根据页面结构：
        # 1. <ul class="wds-tabs" role="tablist"> 包含所有items的类别
        # 2. 每个类别中有每个item的相关属性，是表格形式
        
        knowledge_items = []
        
        # 查找所有表格（每个类别下的表格）
        # 表格可能在 .wds-tab__content 中，或者直接在页面中
        # 尝试多种选择器
        tables = response.css('table')
        logger.debug(f"CSS选择器找到 {len(tables)} 个表格")
        
        # 如果CSS没找到，尝试XPath
        if len(tables) == 0:
            tables = response.xpath('//table')
            logger.debug(f"XPath找到 {len(tables)} 个表格")
        
        # 如果CSS/XPath没找到表格，直接使用response.body解析
        # Scrapy的response可能因为某些原因无法正确解析，我们直接解析HTML内容
        if len(tables) == 0:
            # 重新创建HtmlResponse来确保正确解析
            from scrapy.http import HtmlResponse
            try:
                # 尝试重新解析
                new_response = HtmlResponse(url=response.url, body=response.body, encoding='utf-8')
                tables = new_response.css('table')
                logger.debug(f"重新解析后找到 {len(tables)} 个表格")
            except:
                pass
        
        # 如果还是没找到，使用lxml直接解析HTML字符串
        if len(tables) == 0:
            # 确保响应内容是文本格式
            try:
                body_text = response.text
            except:
                body_text = response.body.decode('utf-8', errors='ignore')
            
            has_table_tag = '<table' in body_text or '<tbody' in body_text
            logger.debug(f"响应中包含table标签: {has_table_tag}, 响应大小: {len(body_text)} 字符")
            
            # 无论是否有table标签，都尝试用lxml解析
            if True:  # 总是尝试lxml解析
                logger.warning("响应中包含table标签，但CSS/XPath无法解析，使用lxml直接解析")
                # 使用lxml直接解析（Scrapy已经依赖lxml）
                try:
                    from lxml import html
                    # 使用response.text或response.body
                    try:
                        html_content = response.text
                    except:
                        html_content = response.body.decode('utf-8', errors='ignore')
                    
                    doc = html.fromstring(html_content.encode('utf-8'))
                    tables_lxml = doc.xpath('//table')
                    logger.debug(f"lxml找到 {len(tables_lxml)} 个表格")
                    
                    # 将lxml元素列表转换为可迭代对象
                    tables = tables_lxml
                    
                    # 将lxml元素转换为可以使用的格式
                    # 我们需要手动解析这些表格
                    for table in tables:
                        rows = table.xpath('.//tr')
                        for row in rows[1:]:  # 跳过表头
                            cells = row.xpath('.//td')
                            if len(cells) == 0:
                                continue
                            
                            # 第一列通常是item名称/链接
                            first_cell = cells[0]
                            name_links = first_cell.xpath('.//a')
                            
                            if len(name_links) == 0:
                                continue
                            
                            name_link = name_links[0]
                            
                            # 获取item名称和URL
                            name = (name_link.text_content().strip() if name_link.text_content() else 
                                   name_link.get('title', ''))
                            href = name_link.get('href', '')
                            
                            if not name or not href:
                                # 从href中提取名称
                                if href:
                                    url_parts = href.split('/')
                                    if len(url_parts) > 0:
                                        name = url_parts[-1].replace('_', ' ').replace('-', ' ')
                            
                            if not name or not href:
                                continue
                            
                            # 排除一些明显不是item的链接
                            exclude_patterns = ['category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                                              'main_page', 'discuss', 'history', 'edit', 'items', '99_nights_in_the_forest']
                            href_lower = href.lower()
                            if any(exclude in href_lower for exclude in exclude_patterns):
                                continue
                            
                            # 提取图片
                            imgs = first_cell.xpath('.//img')
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
                            
                            # 提取描述（从其他列中）
                            description_parts = []
                            for cell in cells[1:]:  # 从第二列开始
                                cell_text = cell.text_content().strip()
                                if cell_text:
                                    description_parts.append(cell_text)
                            
                            description = ' | '.join(description_parts) if description_parts else ""
                            
                            # 规范化URL
                            if href.startswith('/'):
                                full_url = urljoin(self.base_url, href)
                            elif href.startswith('http'):
                                full_url = href
                            else:
                                full_url = urljoin(response.url, href)
                            
                            knowledge_items.append({
                                'name': name.strip(),
                                'url': full_url,
                                'image_url': image_url,
                                'description': description
                            })
                    
                    logger.debug(f"从lxml解析中提取了 {len(knowledge_items)} 个知识点")
                except Exception as e:
                    logger.error(f"lxml解析失败: {e}")
        
        for table in tables:
            # 跳过表头，从第二行开始
            rows = table.css('tr')
            for row in rows[1:]:  # 跳过表头
                cells = row.css('td')
                if len(cells) == 0:
                    continue
                
                # 第一列通常是item名称/链接
                first_cell = cells[0]
                name_link = first_cell.css('a')
                
                if not name_link:
                    # 如果没有链接，尝试查找文本
                    name_text = first_cell.css('::text').get()
                    if name_text and name_text.strip():
                        # 可能是纯文本的item名称
                        continue  # 跳过没有链接的行
                    else:
                        continue
                
                # 获取item名称
                name = (name_link.css('::text').get() or 
                       name_link.css('span::text').get() or 
                       name_link.css('::attr(title)').get())
                href = name_link.css('::attr(href)').get()
                
                if not name or not href:
                    continue
                
                # 从href中提取名称（如果没有文本）
                if not name.strip():
                    url_parts = href.split('/')
                    if len(url_parts) > 0:
                        name = url_parts[-1].replace('_', ' ').replace('-', ' ')
                
                # 排除一些明显不是item的链接
                exclude_patterns = ['category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                                  'main_page', 'discuss', 'history', 'edit', 'items', '99_nights_in_the_forest']
                href_lower = href.lower()
                if any(exclude in href_lower for exclude in exclude_patterns):
                    continue
                
                # 提取图片（可能在第一列中）
                img = first_cell.css('img')
                image_url = None
                if img:
                    # 尝试多种方式获取图片URL
                    img_src = (img[0].css('::attr(data-src)').get() or  # 优先使用data-src（lazy loading）
                              img[0].css('::attr(src)').get() or
                              img[0].css('::attr(data-image-key)').get())
                    
                    if img_src:
                        # 处理lazy loading图片（data:image占位符）
                        if 'data:image' in img_src:
                            # 尝试从data-src或data-image-key获取真实URL
                            img_src = img[0].css('::attr(data-src)').get()
                            if not img_src or 'data:image' in img_src:
                                # 尝试从data-image-key构建URL
                                img_key = img[0].css('::attr(data-image-key)').get()
                                if img_key:
                                    # Fandom Wiki的图片URL格式
                                    img_src = f"https://static.wikia.nocookie.net/99-nights-in-the-forest/images/{img_key}"
                        
                        if img_src and 'data:image' not in img_src:
                            if not img_src.startswith('http'):
                                image_url = urljoin(self.base_url, img_src)
                            else:
                                image_url = img_src
                
                # 提取描述（从其他列中）
                description_parts = []
                for cell in cells[1:]:  # 从第二列开始
                    cell_text = ' '.join(cell.css('::text').getall())
                    if cell_text.strip():
                        description_parts.append(cell_text.strip())
                
                description = ' | '.join(description_parts) if description_parts else ""
                
                # 规范化URL
                if href.startswith('/'):
                    full_url = urljoin(self.base_url, href)
                elif href.startswith('http'):
                    full_url = href
                else:
                    full_url = urljoin(response.url, href)
                
                knowledge_items.append({
                    'name': name.strip(),
                    'url': full_url,
                    'image_url': image_url,
                    'description': description
                })
        
        logger.debug(f"从表格中提取了 {len(knowledge_items)} 个知识点")
        
        logger.info(f"在类别 {category_name} 中找到 {len(knowledge_items)} 个知识点")
        
        # 直接从表格中提取的信息创建知识点，不需要访问详情页面
        for item in knowledge_items:
            # 生成知识点代码（使用URL的最后一个部分）
            url_path = urlparse(item['url']).path
            code = url_path.split('/')[-1] if url_path else item['name'].lower().replace(' ', '_').replace('-', '_')
            
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
                            title=item['name'],
                            description=item.get('description', '')[:9999] if item.get('description') else "",  # 限制长度
                            importance="normal",
                            image_url=item.get('image_url') or "",
                            exam_id=6,  # 设置exam_id=6
                            creator=str(self.user_id),
                            dept_id=self.dept_id
                        )
                        knowledge_obj = knowledge_crud.create(knowledge_in)
                        logger.info(f"创建知识点: {item['name']} (id: {knowledge_obj.id}, code: {code})")
                        
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
                        logger.info(f"知识点已存在: {item['name']} (code: {code})")
                        
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
