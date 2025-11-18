import re
import asyncio
from googletrans import Translator  
import opencc 

from app.core.logger import init_logger
import logging

init_logger()
logger = logging.getLogger(__name__)

# -----------------------------
# 翻译器与 OpenCC
# -----------------------------
translator = Translator()
async def async_translate(text):
    result = await translator.translate(text, src='en', dest='zh-tw')
    return result.text

cc_to_simplified = opencc.OpenCC('t2s.json')  # 繁体 -> 简体

# -----------------------------
# 单位换算函数
# -----------------------------
def convert_units(text):
    # cu.ft -> L
    def cuft_to_l(match):
        val = float(match.group(1))
        liters = round(val * 28.3168)
        return f"{liters} L"
    text = re.sub(r'(\d+(\.\d+)?)\s*cu\. ?ft', cuft_to_l, text, flags=re.IGNORECASE)

    # ml -> 毫升
    text = re.sub(r'(\d+(\.\d+)?)\s*ml', lambda m: f"{m.group(1)} 毫升", text, flags=re.IGNORECASE)

    return text

# -----------------------------
# 商品名称处理函数 (异步)
# -----------------------------
async def translate_product_name(en_name, brand_map, region='HK'):
    en_name_lower = en_name.lower()

    # 品牌识别
    brand = None
    for k in brand_map:
        if k in en_name_lower:
            brand = brand_map[k].get(region, brand_map[k].get('CN'))
            en_name_lower = re.sub(k, '', en_name_lower)  # 去掉品牌
            break

    description = en_name_lower.strip()
    if description:
        translated = await async_translate(description)
        translated = convert_units(translated)
    else:
        translated = ''

    final_name = f"{brand} {translated}".strip() if brand else translated
    simplified_name = cc_to_simplified.convert(final_name)

    return final_name, simplified_name

# -----------------------------
# 批量翻译商品名称 (异步)
# -----------------------------
import re
import asyncio

async def translate_product_names_bulk(en_names, brands, brand_map):
    processed_items = []
    texts_to_translate = []

    for idx, en_name in enumerate(en_names):
        original_brand = (brands[idx] or "").strip()  # 允许空品牌
        en_name_lower = en_name.lower()

        # 只在有品牌时才进行替换，避免空字符串作为正则模式
        if original_brand:
            brand_lower = original_brand.lower()
            en_name_no_brand = re.sub(
                re.escape(brand_lower), '', en_name_lower, flags=re.IGNORECASE
            ).strip()
        else:
            en_name_no_brand = en_name_lower.strip()

        # 分别取 HK 和 CN 的品牌前缀；如果 brand_map 没有，就回退到原始品牌名（或空）
        bm = brand_map.get(original_brand) or {}
        hk_brand = bm.get('HK', original_brand) if original_brand else ''
        cn_brand = bm.get('CN', original_brand) if original_brand else ''

        processed_items.append((hk_brand, cn_brand, en_name_no_brand))
        texts_to_translate.append(en_name_no_brand if en_name_no_brand else '')

    # 异步翻译描述部分（只翻译描述，不翻译品牌）
    translations = [await async_translate(text) if text else '' for text in texts_to_translate]

    # 组装结果
    results = []
    for idx, (hk_brand, cn_brand, description) in enumerate(processed_items):
        # 只对“描述”做单位转换与简繁转换
        translated_text = convert_units(translations[idx]) if description else ''
        # 繁体名称 = HK品牌前缀 + 繁体描述
        final_name = f"{hk_brand} {translated_text}".strip() if hk_brand else translated_text
        # 简体名称 = CN品牌前缀 + 简体描述
        simplified_text = cc_to_simplified.convert(translated_text) if translated_text else ''
        simplified_name = f"{cn_brand} {simplified_text}".strip() if cn_brand else simplified_text

        logger.info(f"翻译结果: {en_names[idx]} -> 繁体: {final_name}, 简体: {simplified_name}")
        results.append((final_name, simplified_name))

    return results

# -----------------------------
# 示例使用
# -----------------------------
if __name__ == "__main__":
    brand_map_example = {
        "advil": {"CN": "艾德维尔", "HK": "Advil"},
        "dove": {"CN": "多芬", "HK": "Dove"},
        "whirlpool": {"CN": "惠而浦", "HK": "Whirlpool"}
    }

    product_list = ['advil mini-gels', 'dove deep moisture body wash 500ml', 'whirlpool 7.4 cu. ft. front load']

    async def main():
        results = await translate_product_names_bulk(product_list, brand_map_example)
        for hk_name, cn_name in results:
            print(f"繁体: {hk_name} | 简体: {cn_name}")

    asyncio.run(main())
