# scrape_util.py
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.utils.scrape_driver import SeleniumDriver
import tempfile
import time
import json

cookie_string = ( "device_type=desktop; site_locale=ca; site_language=en; rcps_cc=true; rcps_po=true; " "rcps_ss=true; current_country=CA; rcps_product=true; rcps_profile_account_group=true; " "rcps_profile_bi_group=true; rcps_profile_info_group=true; rcps_profile_shipping_group=true; " "rcps_sls=true; rcps_profile_userprofile_group=false; rcps_ccap=true; rcps_full_profile_group=true; " "rcps_basket=true; adbanners=on; AKA_A2=A; bm_ss=ab8e18ef4e; rvi_null=2862480; PIM-SESSION-ID=pry6AgB9OnUJzTth; " "at_check=true; ConstructorioID_client_id=f547b478-36eb-471e-bbfc-9b0759454b17; SephSession=04bc3ed4-b905-4ae7-92a5-f6e6ce635dcd; " "rxVisitor=1755040840212Q097IK6BDQE1R9DALPR007525547KM6I; dtSa=-; AMCVS_F6281253512D2BB50A490D45%40AdobeOrg=1; " "s_ecid=MCMID%7C21975051535846967301556471450611563747; AMCV_F6281253512D2BB50A490D45%40AdobeOrg=1585540135%7CMCIDTS%7C20313%7CMCMID%7C21975051535846967301556471450611563747%7CMCAAMLH-1755645640%7C9%7CMCAAMB-1755645640%7CRKhpRz8krg2tLO6pguXWp5olkAcUniQYPHaMWWgdJ3xzPWQmdj0y%7CMCOPTOUT-1755048041s%7CNONE%7CMCAID%7CNONE%7CvVersion%7C4.4.0; " "mboxEdgeCluster=34; ngp_userreg=true; preferredStore=1646; sephora_clarip_consent=0,1; s_visit=1; kampyle_userid=81e1-7f1d-4c54-ab9e-ee41-e361-c7b0-1a57; " "_scid=T8eZg1cSM2Y6N-mVBdgCqnHcVQME5oX_; rxvt=1755042646090|1755040840214; dtPC=-20428$40840208_27h14vNNBAUCPLBBVCAKPCAHSMHGOKCOHAROTM-0e0; " "_tt_enable_cookie=1; _ttp=01K2G9C4NYSJRW3QNHRR3Q1EXA_.tt.1; bluecoreNV=true; dtCookie=v_4_srv_2_sn_00HNQGE612VS9NAQSL72V1P9UNTMUCVK_app-3A010ad61344e68aed_0_ol_0_perc_100000_mul_1; " "_gcl_au=1.1.1033282357.1755040847; _ScCbts=%5B%22149%3Bchrome.2%3A2%3A5%22%5D; _sctr=1%7C1754982000000; _gid=GA1.2.733927966.1755040848; _sp_ses.932a=*; " "_cs_mk=0.9264869071906648_1755040849443; s_cc=true; ab.storage.deviceId.476615b3-3386-4e1c-a9fd-7e174eb9b8de=%7B%22g%22%3A%22d38c5b92-110b-aa19-5ab1-0330eaf8dd42%22%2C%22c%22%3A1755040849981%2C%22l%22%3A1755040849981%7D; sti=5a38ebbb-7d0e-4649-9bc6-61cc244a5646; ssi=5a38ebbb-7d0e-4649-9bc6-61cc244a5646.1755040850567; _fbp=fb.1.1755040850610.910135674605921654; _pin_unauth=dWlkPVlqWmxaV0ZpTTJVdE56WTBNQzAwTTJRNUxUazBOR010TmpFek5URTFNV0k1WXpRNA; ADID=d48a2ad112ba044afe180a4540467ad975dcadcad6328963cbc785088bd0ef08; " "ATG_ORDER_CONTENT=; CNC_ORDER_CONTENT=; bm_so=2A9FD9EE6DFD8C6ACE731A31AC18588F2FBA6004F2427DA7F785079B87F1603B~YAAQl5UeuLiUr5yYAQAA6e6doARQ4/WUEOEUkqa6yDua7dop9X4Upi2I6eqmlfJ/B33DwjQiGvOjI/qXWKLHaIpEIP8f7lDrcERzikltS0D3EvcrnF2eVeEK5raCJc64k5hEhXWoTH46l9S2fO2KKMH5IDTfMMyqsKuVO6kqBil2zYsykrlWQYd0Tf9zG21x1KtLZLkLFR/ZVxtxwqUdOd0Dy5pGBB+9z28a0Y/68sVGCwDGbaMXueXmHK4yQE8BoZTBH5P23KHLVORGrNkPg49jSaxmm+iIZDy6PlwHG4zRxe9A1SI8YOVEUubWtbDSopxkok+HApywV7Ojhhk1IoJq+36FxuAz4GhBIQZLxONGOufyoQV/wdjye02UfOsCs9Dl2CH51tGlKoxTucWORqjUEsGqqTZ8xpiCzO4tNaq+Afe4vJ/Ff2mpC37KCbeAicI7N9bp2zi1VPP620Ga; bm_lso=2A9FD9EE6DFD8C6ACE731A31AC18588F2FBA6004F2427DA7F785079B87F1603B~YAAQl5UeuLiUr5yYAQAA6e6doARQ4/WUEOEUkqa6yDua7dop9X4Upi2I6eqmlfJ/B33DwjQiGvOjI/qXWKLHaIpEIP8f7lDrcERzikltS0D3EvcrnF2eVeEK5raCJc64k5hEhXWoTH46l9S2fO2KKMH5IDTfMMyqsKuVO6kqBil2zYsykrlWQYd0Tf9zG21x1KtLZLkLFR/ZVxtxwqUdOd0Dy5pGBB+9z28a0Y/68sVGCwDGbaMXueXmHK4yQE8BoZTBH5P23KHLVORGrNkPg49jSaxmm+iIZDy6PlwHG4zRxe9A1SI8YOVEUubWtbDSopxkok+HApywV7Ojhhk1IoJq+36FxuAz4GhBIQZLxONGOufyoQV/wdjye02UfOsCs9Dl2CH51tGlKoxTucWORqjUEsGqqTZ8xpiCzO4tNaq+Afe4vJ/Ff2mpC37KCbeAicI7N9bp2zi1VPP620Ga^1755041366621; s_ips=658; s_tp=4575; __gads=ID=49c986449903a7dd3:T=1755040850:RT=1755041369:S=ALNI_Mby7ne_pJHtnxnNnsfv8yE3UREhUA; __gpi=UID=0000125c49fac747:T=1755040850:RT=1755041369:S=ALNI_MY4PD8gYL45O07EeK39BLfooTZ3fg; __eoi=ID=79f25b581fab2763:T=1755040850:RT=1755041369:S=AA-AfjYVZ3hPmz6LbqkidrceXChk; bm_s=YAAQl5UeuEyjr5yYAQAARzeeoAN2I5SQq6n1nZgBWFiFmTnKPZlASpbgT52DicMwqnlZaNWsbC+yLNfJ0ey4liBbzS7qJdmqx2g7SdEoYr1CpJzJAOBGr3A1C/4PNwJG6whIeuNJt1Ge/SNMm/sOZPFzKHbzufZNkcVb/GzDcSjt38JKiFUs3ZmlpS0IbvfII7dCP+na2aj4NqnoAUY0wXOJ2eDrdfCuGYR4LakXuQmgpX2kEiJ6OfR0QFYkSk4qFI5pgM8pf1kslpbhorQnNyhYYRhAMeGwpJZecZyXeleaQI69HMbUDBDXN8VL0tjxc7TPhCtUI27evTF+x4JQsl4rgnNdqTPOuKFtm1zh8P4L0DJcslB9agvYmxfnVGHIUlUP7jre/FqhnJ/vEyMDOuiSjSfZ68BpBgRHjeJm7PcRxpaXtTPTcFDk0ZlMAQNzz0myKAx1XavzXZZyvV392DUD3FwkqRQMSnhTzohuVcjzwoH8I9QUeFabDeaZ6QYpFGaYYRL3qqB9zrIoIdYGbhG4SWOJjvHWu7KCAQ0EC6S7a13YHQlYdhB1cPWULW7crj8Z7xnL3g==; bm_sz=E99EE00A9B51572E9338AA241A98AAF3~YAAQl5UeuE2jr5yYAQAARzeeoBwnDXG3n5AVhvLiKpO/E1Hc/LYkNzQR1YINmuFn1nxHSrGQW46m2beYKbJAPsIpbhEFYOlKzKfx//pmUgDVEjck+ikBTRsFwnGu7wnLbEhO7eRss5m6+Vy2yxj1eSbJCU9yVgcj8L8SHjSNwWdHkos6gNNgOVGyaa6RZC43jqZt2izwedrIBJ9lqfI9JXIf3f7oUhE1xZhXlIbFva62YPIy7x2sEwukA8kaU+A+JJ0Mf32fLc529UIbNMxY6F/dFb66NxUEkYPvDGT4Y+yCoLv6aus3RL9sgbz4hG4catzTtgAS+BbYDuQ4CIyH7g4AG3x4XRQzkXP+Fs5r6hUiRlwO7u2IXs6MzGOK7ZKOluR+rGYc9DjByqWWKYKTMqKWHTA0pqHh6f206kpCpBAqTPeIuLD4Zr+plGWbJxo=")  # 你的cookie字符串

def add_cookies_from_string(driver, cookie_string, domain):
    cookies = cookie_string.split("; ")
    for cookie in cookies:
        if '=' in cookie:
            name, value = cookie.split("=", 1)
            cookie_dict = {
                'name': name,
                'value': value,
                'domain': domain,
                'path': '/',
                'secure': True,
                'httpOnly': False,
            }
            try:
                driver.add_cookie(cookie_dict)
            except Exception as e:
                print(f"Cookie注入失败: {cookie_dict['name']} - {e}")

def scrape_sephora(product_id: str, sku_id: str) -> dict:
    driver = SeleniumDriver()
    wait = WebDriverWait(driver, 15)

    try:
        # 先打开首页注入 cookie
        driver.get("https://www.sephora.com")
        time.sleep(2)
        add_cookies_from_string(driver, cookie_string, domain="www.sephora.com")

        # 打开产品页
        url = f"https://www.sephora.com/ca/en/product/summer-fridays-lip-butter-balm-{product_id}?skuId={sku_id}"
        print(url)
        driver.get(url)
        wait.until(EC.presence_of_element_located((By.ID, "linkStore")))     

        script_tag = driver.find_element(By.ID, "linkStore")
        data = json.loads(script_tag.get_attribute("innerHTML").strip())

        product = data.get("page", {}).get("product", {})
        current_sku = product.get("currentSku", {})

        images = [
            {
                "image250": img.get("image250"),
                "altText": img.get("altText"),
                "imageUrl": img.get("imageUrl"),
            }
            for img in current_sku.get("alternateImages", [])
        ]

        result = {
            "productId": product.get("productId"),
            "brandName": product.get("brandName"),
            "seoName": product.get("seoName"),
            "productName": current_sku.get("productName"),
            "skuId": current_sku.get("skuId"),
            "listPrice": current_sku.get("listPrice"),
            "size": current_sku.get("size"),
            "variationType": current_sku.get("variationType"),
            "variationTypeDisplayName": current_sku.get("variationTypeDisplayName"),
            "variationValue": current_sku.get("variationValue"),
            "images": images,
        }
    except Exception as e:
        print(f"抓取失败: {e}")        

        return result

import pprint

if __name__ == "__main__":
    product_id = "P455936"
    sku_id = "2862480"
    product_info = scrape_sephora(product_id, sku_id)
    
    pprint.pprint(product_info)