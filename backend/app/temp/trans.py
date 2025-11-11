import re
import asyncio
from googletrans import Translator  
import opencc 
from app.utils.translate_util import translate_product_name, translate_product_names_bulk
# -----------------------------
# 主函数
# -----------------------------
# -----------------------------
# 调用示例
# -----------------------------
if __name__ == "__main__":
    sample_data = [
        "Advil Liquid Gel 200ml",
        "Dove Body Wash 500ml",
        "Whirlpool Fridge 10 cu.ft",
        "Apple Juice 250ml"
    ]

    async def main():
        # 单个翻译
        print("=== 单个翻译 ===")
        hk_name, cn_name = await translate_product_name(sample_data[0])
        print(f"HK: {hk_name}, CN: {cn_name}")

        # 批量翻译
        print("\n=== 批量翻译 ===")
        results = await translate_product_names_bulk(sample_data)
        for i, (hk, cn) in enumerate(results):
            print(f"{sample_data[i]} -> HK: {hk}, CN: {cn}")

    asyncio.run(main())
