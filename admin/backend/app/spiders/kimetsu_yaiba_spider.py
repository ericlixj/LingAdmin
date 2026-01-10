# spiders/kimetsu_yaiba_spider.py
"""
Kimetsu no Yaiba (Demon Slayer) Wiki 爬虫
从 https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki 爬取数据
- 创建 study_source_section (source_id=3)
- 创建 study_knowledge_node
- 建立 study_knowledge_source_section 关联
"""
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


class KimetsuYaibaSpider(scrapy.Spider):
    name = "kimetsu_yaiba_spider"
    
    # 来源ID，根据用户要求设置为3
    SOURCE_ID = 3
    
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
    
    # Kimetsu no Yaiba Wiki 的主要分类结构
    # 根据网站结构，主要分类包括：
    # - Story Arcs（故事章节）
    # - Characters（角色）
    # - Abilities & Techniques（能力和技巧）
    # - Breathing Styles（呼吸法）
    # - Locations（地点）
    # - Objects（物品）
    MAIN_CATEGORIES = [
        {'name': 'Story Arcs', 'url_path': '/wiki/Story_Arcs', 'type': 'chapter'},
        {'name': 'Characters', 'url_path': '/wiki/Characters', 'type': 'chapter'},
        {'name': 'Abilities & Techniques', 'url_path': '/wiki/Abilities_%26_Techniques', 'type': 'chapter'},
        {'name': 'Breathing Styles', 'url_path': '/wiki/Breathing_Styles', 'type': 'chapter'},
        {'name': 'Locations', 'url_path': '/wiki/Locations', 'type': 'chapter'},
        {'name': 'Objects', 'url_path': '/wiki/Objects', 'type': 'chapter'},
    ]
    
    def __init__(self, user_id: int = 1, dept_id: int = 1, exam_id: int = None, test_limit: int = None):
        super().__init__()
        self.user_id = user_id
        self.dept_id = dept_id
        self.exam_id = exam_id  # 知识点关联的 exam_id
        self.test_limit = test_limit  # 测试模式：限制处理的链接数量
        self.base_url = "https://kimetsu-no-yaiba.fandom.com"
        self.category_sections = {}  # 存储类别名称到section_id的映射
        self.section_knowledge_map = {}  # 存储 section_id 到知识点列表的映射
        
    def start_requests(self):
        """开始请求，先创建章节结构，然后爬取内容"""
        headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        
        # 先创建所有主要类别的章节记录
        with Session(engine) as session:
            section_crud = StudySourceSectionCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
            
            for category in self.MAIN_CATEGORIES:
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
                            section="",  # 主要类别暂时没有section
                            page_start=0,
                            page_end=0,
                            anchor_text=f"Kimetsu no Yaiba Wiki类别: {category_name}",
                            creator=str(self.user_id),
                            dept_id=self.dept_id
                        )
                        section_obj = section_crud.create(section_in)
                        self.category_sections[category_name] = section_obj.id
                        logger.info(f"创建章节: {category_name} (id: {section_obj.id})")
                    except Exception as e:
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
                    self.category_sections[category_name] = existing.id
                    logger.info(f"使用已有章节: {category_name} (id: {existing.id})")
        
        # 开始爬取各个类别页面
        for category in self.MAIN_CATEGORIES:
            url = urljoin(self.base_url, category['url_path'])
            logger.info(f"开始爬取类别: {category['name']} - {url}")
            yield scrapy.Request(
                url=url,
                callback=self.parse_category_page,
                meta={'category_name': category['name']},
                headers=headers
            )
    
    def parse_category_page(self, response):
        """解析类别页面，提取子分类和知识点"""
        category_name = response.meta.get('category_name', 'Unknown')
        logger.info(f"解析类别页面: {category_name} - {response.url}")
        
        section_id = self.category_sections.get(category_name)
        if not section_id:
            logger.warning(f"未找到类别 {category_name} 的章节ID，跳过")
            return
        
        # 获取响应内容
        try:
            body_text = response.text
        except:
            try:
                body_text = response.body.decode('utf-8', errors='ignore')
            except:
                logger.error("无法获取响应文本内容")
                return
        
        # 如果响应太小，使用curl重新获取
        if len(body_text) < 50000:
            logger.warning(f"Scrapy响应内容不完整 ({len(body_text)} 字符)，使用curl重新获取")
            import subprocess
            try:
                curl_cmd = [
                    'curl', '-s', '-L',
                    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--compressed',
                    response.url
                ]
                result = subprocess.run(curl_cmd, capture_output=True, text=False, timeout=30)
                if result.returncode == 0 and len(result.stdout) > 50000:
                    body_text = result.stdout.decode('utf-8', errors='ignore')
                    logger.info(f"使用curl获取到 {len(body_text)} 字符的内容")
                    from scrapy.http import HtmlResponse
                    response = HtmlResponse(url=response.url, body=result.stdout, encoding='utf-8')
            except Exception as e:
                logger.error(f"使用curl获取内容失败: {e}")
        
        # 解析页面内容，提取子分类和知识点
        logger.info(f"准备调用 _parse_category_content，response类型: {type(response)}, URL: {response.url}")
        # _parse_category_content 是一个生成器，需要 yield 它返回的请求
        yield from self._parse_category_content(response, category_name, section_id)
        logger.info(f"_parse_category_content 调用完成")
    
    def _parse_category_content(self, response, category_name, parent_section_id):
        """解析类别内容，提取子分类和知识点"""
        logger.info(f"解析类别内容: {category_name}")
        print(f"[DEBUG] 解析类别内容: {category_name}")  # 强制输出
        
        # 使用lxml解析HTML
        try:
            from lxml import html
            try:
                html_content = response.text
                logger.debug(f"从response.text获取内容，长度: {len(html_content)}")
            except Exception as e:
                logger.warning(f"无法从response.text获取内容: {e}，尝试从body获取")
                html_content = response.body.decode('utf-8', errors='ignore')
                logger.debug(f"从response.body获取内容，长度: {len(html_content)}")
            
            logger.info(f"HTML内容长度: {len(html_content) if html_content else 0} 字符")
            if not html_content or len(html_content) < 100:
                logger.error(f"HTML内容太短或为空: {len(html_content) if html_content else 0} 字符，跳过解析")
                return
            
            doc = html.fromstring(html_content.encode('utf-8'))
            logger.debug(f"成功解析HTML文档")
            
            # 查找所有链接，这些可能是子分类或知识点
            # Fandom Wiki 通常使用 .category-page__member 或类似的类来显示列表项
            knowledge_items = []
            
            # 方法1: 查找分类页面中的成员链接（Fandom Wiki 的标准结构）
            member_links = doc.xpath('//a[contains(@class, "category-page__member")] | //a[contains(@class, "category-page__member-link")]')
            logger.debug(f"方法1找到 {len(member_links)} 个member链接")
            
            # 方法2: 查找表格中的链接
            table_links = doc.xpath('//table//a[contains(@href, "/wiki/")]')
            logger.debug(f"方法2找到 {len(table_links)} 个table链接")
            
            # 方法3: 查找列表中的链接
            list_links = doc.xpath('//ul//a[contains(@href, "/wiki/")] | //ol//a[contains(@href, "/wiki/")]')
            logger.debug(f"方法3找到 {len(list_links)} 个list链接")
            
            # 方法4: 查找所有指向wiki页面的链接
            wiki_links = doc.xpath('//a[starts-with(@href, "/wiki/")]')
            logger.debug(f"方法4找到 {len(wiki_links)} 个wiki链接")
            
            # 合并所有链接（去重）
            all_links_dict = {}
            for link in member_links + table_links + list_links + wiki_links:
                href = link.get('href', '')
                if href and href not in all_links_dict:
                    all_links_dict[href] = link
            
            all_links = list(all_links_dict.values())
            
            logger.info(f"找到 {len(all_links)} 个链接（去重后）")
            print(f"[DEBUG] 找到 {len(all_links)} 个链接（去重后）")  # 强制输出
            
            # 提取知识点信息
            seen_urls = set()
            for link in all_links:
                href = link.get('href', '')
                if not href or href.startswith('#'):
                    continue
                
                # 构建完整URL
                if href.startswith('/'):
                    full_url = urljoin(self.base_url, href)
                elif href.startswith('http'):
                    full_url = href
                else:
                    full_url = urljoin(response.url, href)
                
                # 排除不需要的链接
                # 注意：只排除确切的类别页面URL，不排除包含这些词的普通页面
                exclude_patterns = [
                    'category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                    'main_page', 'discuss', 'history', 'edit', 'search', 'random',
                    'kimetsu_no_yaiba_wiki'
                ]
                # 排除确切的类别页面URL（完整匹配）
                exact_excludes = [
                    '/wiki/Story_Arcs', '/wiki/Characters', '/wiki/Abilities', 
                    '/wiki/Breathing_Styles', '/wiki/Locations', '/wiki/Objects'
                ]
                href_lower = href.lower()
                # 检查是否匹配排除模式
                if any(exclude in href_lower for exclude in exclude_patterns):
                    continue
                # 检查是否是确切的类别页面（完整路径匹配）
                if href in exact_excludes or href.lower() in [e.lower() for e in exact_excludes]:
                    continue
                
                # 去重
                if full_url in seen_urls:
                    continue
                seen_urls.add(full_url)
                
                # 提取名称
                name = link.text_content().strip() if link.text_content() else ''
                if not name:
                    # 尝试从title属性获取
                    name = link.get('title', '').strip()
                if not name:
                    # 从URL提取
                    url_path = urlparse(full_url).path
                    name = url_path.split('/')[-1].replace('_', ' ') if url_path else ''
                
                if not name or len(name) < 2:
                    continue
                
                # 提取图片
                img = link.xpath('.//img')
                image_url = None
                if len(img) > 0:
                    img_src = img[0].get('data-src') or img[0].get('src') or img[0].get('data-image-key')
                    if img_src:
                        # 处理data:image
                        if 'data:image' in img_src:
                            img_key = img[0].get('data-image-key')
                            if img_key:
                                img_src = f"https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/{img_key}"
                        if img_src and 'data:image' not in img_src:
                            if not img_src.startswith('http'):
                                image_url = urljoin(self.base_url, img_src)
                            else:
                                image_url = img_src
                
                knowledge_items.append({
                    'name': name,
                    'url': full_url,
                    'image_url': image_url,
                    'description': ''  # 描述需要从详情页获取
                })
            
            logger.info(f"从类别 {category_name} 中提取了 {len(knowledge_items)} 个知识点")
            
            # 测试模式：限制处理的链接数量
            if self.test_limit and len(knowledge_items) > self.test_limit:
                logger.info(f"测试模式：限制处理前 {self.test_limit} 个知识点（共 {len(knowledge_items)} 个）")
                knowledge_items = knowledge_items[:self.test_limit]
            
            # 为每个知识点请求详情页以获取描述
            if knowledge_items:
                logger.info(f"开始为 {len(knowledge_items)} 个知识点请求详情页...")
                for idx, item in enumerate(knowledge_items, 1):
                    if idx <= 5:  # 只记录前5个
                        logger.info(f"  请求详情页 {idx}/{len(knowledge_items)}: {item['name']} - {item['url']}")
                    yield scrapy.Request(
                        url=item['url'],
                        callback=self.parse_knowledge_detail,
                        meta={
                            'item': item,
                            'section_id': parent_section_id,
                            'category_name': category_name
                        },
                        dont_filter=False
                    )
            else:
                logger.warning(f"类别 {category_name} 没有提取到知识点，跳过详情页请求")
            
        except Exception as e:
            logger.error(f"解析类别内容失败: {e}", exc_info=True)
            logger.info(f"回退到简单方法解析类别: {category_name}")
            import traceback
            logger.error(f"异常详情: {traceback.format_exc()}")
            # 回退到简单方法
            self._parse_simple_links(response, category_name, parent_section_id)
    
    def _parse_simple_links(self, response, category_name, section_id):
        """简单方法：直接从页面提取所有链接"""
        knowledge_items = []
        
        # 使用Scrapy的CSS选择器
        links = response.css('a[href*="/wiki/"]')
        seen_urls = set()
        
        for link in links:
            href = link.css('::attr(href)').get()
            if not href or href.startswith('#'):
                continue
            
            # 构建完整URL
            if href.startswith('/'):
                full_url = urljoin(self.base_url, href)
            elif href.startswith('http'):
                full_url = href
            else:
                full_url = urljoin(response.url, href)
            
            # 去重
            if full_url in seen_urls:
                continue
            seen_urls.add(full_url)
            
            # 排除不需要的链接
            exclude_patterns = [
                'category:', 'file:', 'special:', 'user:', 'template:', 'help:', 'talk:',
                'main_page', 'discuss', 'history', 'edit', 'search', 'random',
                'kimetsu_no_yaiba_wiki'
            ]
            # 排除确切的类别页面URL（完整匹配）
            exact_excludes = [
                '/wiki/Story_Arcs', '/wiki/Characters', '/wiki/Abilities', 
                '/wiki/Breathing_Styles', '/wiki/Locations', '/wiki/Objects'
            ]
            href_lower = href.lower()
            # 检查是否匹配排除模式
            if any(exclude in href_lower for exclude in exclude_patterns):
                continue
            # 检查是否是确切的类别页面（完整路径匹配）
            if href in exact_excludes or href.lower() in [e.lower() for e in exact_excludes]:
                continue
            
            # 提取名称
            name = ' '.join(link.css('::text').getall()).strip()
            if not name:
                name = link.css('::attr(title)').get() or ''
            if not name:
                url_path = urlparse(full_url).path
                name = url_path.split('/')[-1].replace('_', ' ') if url_path else ''
            
            if not name or len(name) < 2:
                continue
            
            # 提取图片
            img = link.css('img')
            image_url = None
            if img:
                img_src = img.css('::attr(data-src)').get() or img.css('::attr(src)').get()
                if img_src:
                    if not img_src.startswith('http'):
                        image_url = urljoin(self.base_url, img_src)
                    else:
                        image_url = img_src
            
            knowledge_items.append({
                'name': name,
                'url': full_url,
                'image_url': image_url,
                'description': ''
            })
        
        logger.info(f"从类别 {category_name} 中提取了 {len(knowledge_items)} 个知识点（简单方法）")
        
        # 测试模式：限制处理的链接数量
        if self.test_limit and len(knowledge_items) > self.test_limit:
            logger.info(f"测试模式：限制处理前 {self.test_limit} 个知识点（共 {len(knowledge_items)} 个）")
            knowledge_items = knowledge_items[:self.test_limit]
        
        # 为每个知识点请求详情页以获取描述
        if knowledge_items:
            logger.info(f"开始为 {len(knowledge_items)} 个知识点请求详情页（简单方法）...")
            for idx, item in enumerate(knowledge_items, 1):
                if idx <= 5:  # 只记录前5个
                    logger.info(f"  请求详情页 {idx}/{len(knowledge_items)}: {item['name']} - {item['url']}")
                yield scrapy.Request(
                    url=item['url'],
                    callback=self.parse_knowledge_detail,
                    meta={
                        'item': item,
                        'section_id': section_id,
                        'category_name': category_name
                    },
                    dont_filter=False
                )
        else:
            logger.warning(f"类别 {category_name} 没有提取到知识点（简单方法），跳过详情页请求")
    
    def parse_knowledge_detail(self, response):
        """解析知识点详情页，提取描述（作为Flashcard的答案）"""
        item = response.meta.get('item', {})
        section_id = response.meta.get('section_id')
        category_name = response.meta.get('category_name', 'Unknown')
        
        logger.info(f"解析知识点详情: {item.get('name', 'N/A')} - {response.url}")
        
        # 检查响应内容是否完整，如果不完整则使用curl重新获取
        try:
            body_text = response.text
        except:
            try:
                body_text = response.body.decode('utf-8', errors='ignore')
            except:
                logger.error("无法获取响应文本内容")
                body_text = ""
        
        # 如果响应太小，使用curl重新获取
        if len(body_text) < 50000:
            logger.warning(f"Scrapy响应内容不完整 ({len(body_text)} 字符)，使用curl重新获取")
            import subprocess
            try:
                curl_cmd = [
                    'curl', '-s', '-L',
                    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    '--compressed',
                    response.url
                ]
                result = subprocess.run(curl_cmd, capture_output=True, text=False, timeout=30)
                if result.returncode == 0 and len(result.stdout) > 50000:
                    body_text = result.stdout.decode('utf-8', errors='ignore')
                    logger.info(f"使用curl获取到 {len(body_text)} 字符的内容")
                    from scrapy.http import HtmlResponse
                    response = HtmlResponse(url=response.url, body=result.stdout, encoding='utf-8')
            except Exception as e:
                logger.error(f"使用curl获取内容失败: {e}")
        
        # 提取描述（作为Flashcard的答案内容）
        # 应该提取主要内容，包括介绍、特点、背景等信息
        description = ""
        
        try:
            # 方法1: 从 .mw-parser-output 中提取所有段落文本（Fandom Wiki 的标准结构）
            # 这是主要内容区域，包含详细的描述信息
            description_parts = []
            
            # 优先使用lxml提取，因为它能更好地处理嵌套结构
            from lxml import html
            try:
                html_content = response.text
                doc = html.fromstring(html_content.encode('utf-8'))
                # 查找 .mw-parser-output 下的所有段落
                parser_output = doc.xpath('//div[contains(@class, "mw-parser-output")]')
                if parser_output:
                    # 提取段落文本（排除导航框、信息框等）
                    paragraphs_xpath = parser_output[0].xpath('.//p[not(ancestor::div[contains(@class, "navbox")]) and not(ancestor::div[contains(@class, "infobox")]) and not(ancestor::table)]')
                    for para in paragraphs_xpath:
                        text = para.text_content().strip() if para.text_content() else ''
                        # 过滤太短的文本和只包含空白/换行的文本
                        if text and len(text) > 20 and not text.replace('\n', '').replace('\t', '').strip() == '':
                            # 清理文本：移除多余的空白和换行
                            text = ' '.join(text.split())
                            description_parts.append(text)
                    
                    # 如果段落不够，也提取列表项
                    if len(description_parts) < 3:
                        list_items_xpath = parser_output[0].xpath('.//li[not(ancestor::div[contains(@class, "navbox")]) and not(ancestor::div[contains(@class, "infobox")])]')
                        for li in list_items_xpath:
                            text = li.text_content().strip() if li.text_content() else ''
                            if text and len(text) > 20:
                                text = ' '.join(text.split())
                                description_parts.append(text)
            except Exception as e:
                logger.warning(f"使用lxml解析失败: {e}，回退到CSS选择器")
                # 回退到CSS选择器
                paragraphs = response.css('.mw-parser-output p')
                for para in paragraphs:
                    text = ' '.join(para.css('::text').getall()).strip()
                    if text and len(text) > 20:
                        description_parts.append(text)
            
            # 如果提取到了内容，组合成描述
            if description_parts:
                # 取前10段或前5000字符，确保内容完整但不过长
                combined = ' '.join(description_parts)
                if len(combined) > 9999:
                    # 如果太长，尝试智能截取：保留前几段直到接近限制
                    truncated = ''
                    for part in description_parts:
                        if len(truncated) + len(part) + 1 < 9996:
                            truncated += (part + ' ')
                        else:
                            break
                    description = truncated.strip() + "..."
                else:
                    description = combined
            
            # 方法2: 如果方法1没有结果，尝试从 infobox 中提取关键信息
            if not description or len(description) < 100:
                infobox_items = []
                # 提取 infobox 的标签和值
                labels = response.css('.infobox .infobox-label::text').getall()
                values = response.css('.infobox .infobox-data::text, .infobox .infobox-data a::text').getall()
                for label, value in zip(labels, values):
                    if label.strip() and value.strip():
                        infobox_items.append(f"{label.strip()}: {value.strip()}")
                if infobox_items:
                    description = ' | '.join(infobox_items)
            
            # 方法3: 如果还是没有，尝试从页面标题和第一段提取
            if not description or len(description) < 50:
                first_paragraph = response.css('.mw-parser-output > p:first-child::text').get()
                if first_paragraph:
                    description = first_paragraph.strip()
            
            # 清理描述：移除多余的空白字符和特殊字符
            if description:
                # 移除多余的空白
                description = ' '.join(description.split())
                # 移除一些常见的Wiki标记
                description = description.replace('[citation needed]', '')
                description = description.replace('[1]', '')
                description = description.replace('[2]', '')
                description = description.replace('[3]', '')
                # 限制长度
                if len(description) > 9999:
                    description = description[:9996] + "..."
            
            logger.info(f"  提取的描述长度: {len(description)} 字符")
            if description:
                logger.debug(f"  描述预览: {description[:200]}...")
            else:
                logger.warning(f"  未能提取到描述内容")
            
        except Exception as e:
            logger.warning(f"提取描述失败: {e}", exc_info=True)
        
        # 更新 item 的 description
        item['description'] = description
        
        # 如果图片还没有，尝试从详情页提取
        if not item.get('image_url'):
            images = response.css('.mw-parser-output img, .infobox img, .image img')
            if images:
                img_src = images[0].css('::attr(src)').get() or images[0].css('::attr(data-src)').get()
                if img_src:
                    if not img_src.startswith('http'):
                        item['image_url'] = urljoin(self.base_url, img_src)
                    else:
                        item['image_url'] = img_src
        
        # 保存知识点
        self._save_knowledge_item(item, section_id)
    
    def _save_knowledge_item(self, item, section_id):
        """保存单个知识点到数据库并建立关联"""
        logger.info(f"\n保存知识点: {item.get('name', 'N/A')}")
        logger.info(f"  URL: {item.get('url', 'N/A')}")
        logger.info(f"  描述长度: {len(item.get('description', ''))} 字符")
        
        # 生成知识点代码（使用URL的最后一个部分）
        url_path = urlparse(item['url']).path
        code = url_path.split('/')[-1] if url_path else item['name'].lower().replace(' ', '_').replace('-', '_')
        
        # 清理code
        code = re.sub(r'[^\w]', '_', code).strip('_')
        if not code or code == 'wiki':
            code = item['name'].lower().replace(' ', '_').replace('-', '_')
            code = re.sub(r'[^\w]', '_', code).strip('_')
        
        logger.info(f"  生成的code: {code}")
        
        # 保存到数据库
        try:
            with Session(engine) as session:
                knowledge_crud = StudyKnowledgeNodeCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
                
                # 检查是否已存在（优先根据code，因为code是唯一的）
                existing = session.exec(
                    select(StudyKnowledgeNode).where(
                        StudyKnowledgeNode.code == code,
                        StudyKnowledgeNode.deleted == False
                    )
                ).first()
                
                # 如果code不存在，再检查title
                if not existing:
                    existing = session.exec(
                        select(StudyKnowledgeNode).where(
                            StudyKnowledgeNode.title == item['name'],
                            StudyKnowledgeNode.deleted == False
                        )
                    ).first()
                
                if not existing:
                    # 创建新知识点
                    knowledge_in = StudyKnowledgeNodeCreate(
                        code=code,
                        title=item['name'],
                        description=item.get('description', '')[:9999] if item.get('description') else "",
                        importance="normal",
                        image_url=item.get('image_url') or "",
                        exam_id=self.exam_id,  # 使用传入的exam_id
                        creator=str(self.user_id),
                        dept_id=self.dept_id
                    )
                    knowledge_obj = knowledge_crud.create(knowledge_in)
                    logger.info(f"  ✅ 创建新知识点: {item['name']} (id: {knowledge_obj.id})")
                    
                    # 创建知识点与章节的关联
                    self._create_knowledge_section_link(session, knowledge_obj.id, section_id, item['name'])
                else:
                    # 如果知识点已存在，检查是否需要更新描述（答案）
                    needs_update = False
                    update_data = {}
                    
                    # 如果现有知识点没有描述（答案），但新提取的有描述，则更新
                    if not existing.description or len(existing.description.strip()) == 0:
                        if item.get('description') and len(item.get('description', '').strip()) > 0:
                            update_data['description'] = item.get('description', '')[:9999]
                            needs_update = True
                            logger.info(f"  ℹ️  现有知识点描述为空，将更新为新提取的描述")
                    # 如果现有知识点有描述但很短（可能是之前没有完整提取），新描述更长，则更新
                    elif item.get('description') and len(item.get('description', '').strip()) > len(existing.description.strip()) * 1.5:
                        update_data['description'] = item.get('description', '')[:9999]
                        needs_update = True
                        logger.info(f"  ℹ️  新描述更完整（{len(item.get('description', ''))} vs {len(existing.description)} 字符），将更新")
                    
                    # 如果现有知识点没有图片，但新提取的有图片，则更新
                    if not existing.image_url and item.get('image_url'):
                        update_data['image_url'] = item.get('image_url', '')
                        needs_update = True
                    
                    if needs_update:
                        from app.models.studyKnowledgeNode import StudyKnowledgeNodeUpdate
                        from datetime import datetime
                        update_obj = StudyKnowledgeNodeUpdate(**update_data)
                        update_obj.updater = str(self.user_id)
                        existing = knowledge_crud.update(existing, update_obj)
                        logger.info(f"  ✅ 更新知识点: {item['name']} (id: {existing.id})")
                        if 'description' in update_data:
                            logger.info(f"     描述已更新，长度: {len(update_data['description'])} 字符")
                    else:
                        logger.info(f"  ⏭️  知识点已存在: {item['name']} (code: {code}, id: {existing.id})")
                        if existing.description:
                            logger.info(f"     现有描述长度: {len(existing.description)} 字符")
                    
                    # 即使知识点已存在，也检查并创建关联
                    self._create_knowledge_section_link(session, existing.id, section_id, item['name'])
                        
        except Exception as e:
            logger.error(f"保存知识点失败: {item['name']} - {str(e)}", exc_info=True)
    
    def _create_knowledge_section_link(self, session, knowledge_node_id, source_section_id, item_name):
        """创建知识点与章节的关联"""
        try:
            link_crud = StudyKnowledgeSourceSectionCRUD(session, user_id=self.user_id, dept_id=self.dept_id)
            
            # 检查关联是否已存在
            existing_link = session.exec(
                select(StudyKnowledgeSourceSection).where(
                    StudyKnowledgeSourceSection.knowledge_node_id == knowledge_node_id,
                    StudyKnowledgeSourceSection.source_section_id == source_section_id,
                    StudyKnowledgeSourceSection.deleted == False
                )
            ).first()
            
            if not existing_link:
                link_in = StudyKnowledgeSourceSectionCreate(
                    knowledge_node_id=knowledge_node_id,
                    source_section_id=source_section_id,
                    creator=str(self.user_id),
                    dept_id=self.dept_id
                )
                link_obj = link_crud.create(link_in)
                logger.info(f"  ✅ 创建知识点关联: {item_name} -> section_id={source_section_id} (link_id: {link_obj.id})")
            else:
                logger.info(f"  ℹ️  知识点关联已存在: {item_name} -> section_id={source_section_id}")
        except Exception as e:
            logger.error(f"创建知识点关联失败: {item_name} - {str(e)}", exc_info=True)
