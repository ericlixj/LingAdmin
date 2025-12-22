#!/usr/bin/env python3
"""
爬取 Aarav Driving School 的 Class 4 练习题
网站: https://aaravdrivingschool.com

测试页面 URL 映射:
- Test 1 (40题): test.php?t=72
- Test 2 (40题): test.php?t=73
- Test 3 (40题): test.php?t=74
- Test 4 (40题): test.php?t=75
- Test 5 (40题): test.php?t=76
- Test 6 (40题): test.php?t=77
- Test 7 (25题): test.php?t=78

API:
- loadnextques.php: POST {test_id, ques_id, ques_index} -> 返回下一题 HTML
- checker.php: POST {test_id, ques_id, answer} -> 返回正确答案数字 (1=A, 2=B, 3=C, 4=D)
"""

import json
import time
import re
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://aaravdrivingschool.com"
TEST_PAGE_URL = f"{BASE_URL}/test.php"
LOAD_NEXT_URL = f"{BASE_URL}/test/loadnextques.php"
CHECKER_URL = f"{BASE_URL}/test/checker.php"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/test.php",
}

# 测试 ID 映射
TEST_IDS = {
    1: 72,
    2: 73,
    3: 74,
    4: 75,
    5: 76,
    6: 77,
    7: 78,
}

TEST_QUESTION_COUNTS = {
    1: 40,
    2: 40,
    3: 40,
    4: 40,
    5: 40,
    6: 40,
    7: 25,
}


def get_correct_answer(test_id: int, ques_id: int) -> Optional[str]:
    """
    通过 checker API 获取正确答案
    返回: "A", "B", "C", "D" 或 None
    """
    # 发送任意答案，API 会返回正确答案的数字
    data = {
        "test_id": test_id,
        "ques_id": ques_id,
        "answer": 1,
    }
    try:
        response = requests.post(CHECKER_URL, headers=HEADERS, data=data, timeout=10)
        response.raise_for_status()
        
        result = response.text.strip()
        if result.isdigit():
            answer_num = int(result)
            if 1 <= answer_num <= 4:
                return ["A", "B", "C", "D"][answer_num - 1]
    except Exception as e:
        print(f"    获取答案出错: {e}")
    
    return None


def parse_question_html(html: str, test_num: int, ques_index: int) -> dict:
    """解析问题 HTML"""
    soup = BeautifulSoup(html, "html.parser")
    
    question_data = {
        "test_num": test_num,
        "question_num": ques_index,
        "ques_id": None,
        "stem": "",
        "options": {},
        "answer": None,
        "image_url": None,
    }
    
    # 提取问题文本
    question_text = soup.find(class_="question-text")
    if question_text:
        question_data["stem"] = question_text.get_text(strip=True)
    
    # 提取选项
    option_letters = ["A", "B", "C", "D"]
    for i, letter in enumerate(option_letters, 1):
        option_div = soup.find(id=f"a{i}")
        if option_div:
            content = option_div.find(class_="question-answer-content")
            if content:
                question_data["options"][letter] = content.get_text(strip=True)
    
    # 提取问题 ID (从 onclick 属性)
    match = re.search(r'questiontest\(\d+,(\d+),\d+\)', html)
    if match:
        question_data["ques_id"] = int(match.group(1))
    
    # 提取下一题的问题 ID (用于获取下一题)
    match = re.search(r'loadNext\(\d+,(\d+)\)', html)
    if match:
        question_data["next_ques_id"] = int(match.group(1))
    
    # 检查图片
    img_tags = soup.find_all("img")
    for img in img_tags:
        src = img.get("src", "")
        if src and not any(x in src.lower() for x in ["logo", "icon", "lock", "ulock", "footer", "favicon"]):
            question_data["image_url"] = src if src.startswith("http") else f"{BASE_URL}/{src}"
            break
    
    return question_data


def fetch_first_question(test_id: int) -> tuple[str, int]:
    """获取测试的第一道题"""
    url = f"{TEST_PAGE_URL}?t={test_id}"
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    
    html = response.text
    
    # 从 JavaScript 中提取第一个问题的 ID
    match = re.search(r'loadNext\(\d+,(\d+)\)', html)
    ques_id = int(match.group(1)) if match else 0
    
    return html, ques_id


def fetch_next_question(test_id: int, ques_id: int, ques_index: int) -> str:
    """获取下一道题的 HTML"""
    data = {
        "test_id": test_id,
        "ques_id": ques_id,
        "ques_index": ques_index,
    }
    response = requests.post(LOAD_NEXT_URL, headers=HEADERS, data=data, timeout=30)
    response.raise_for_status()
    return response.text


def scrape_test(test_num: int, save_html: bool = False) -> list[dict]:
    """爬取单个测试的所有问题"""
    test_id = TEST_IDS[test_num]
    total_questions = TEST_QUESTION_COUNTS[test_num]
    
    print(f"\n正在爬取 Test {test_num} (ID={test_id}, {total_questions}题)...")
    
    questions = []
    
    # 获取第一道题
    html, current_ques_id = fetch_first_question(test_id)
    
    if save_html:
        html_file = Path(__file__).parent / f"aarav_test_{test_num}_q1.html"
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html)
    
    # 解析第一道题
    q_data = parse_question_html(html, test_num, 1)
    if q_data["ques_id"] is None:
        q_data["ques_id"] = current_ques_id
    
    # 获取正确答案
    if q_data["ques_id"]:
        q_data["answer"] = get_correct_answer(test_id, q_data["ques_id"])
    
    # 更新 current_ques_id
    if "next_ques_id" in q_data:
        current_ques_id = q_data.pop("next_ques_id")
    
    questions.append(q_data)
    stem_preview = q_data['stem'][:40] + "..." if len(q_data['stem']) > 40 else q_data['stem']
    print(f"  第 1 题: {stem_preview} 答案: {q_data['answer']}")
    
    # 获取剩余题目
    for ques_index in range(2, total_questions + 1):
        try:
            time.sleep(0.3)  # 礼貌性延迟
            
            # 获取下一题
            html = fetch_next_question(test_id, current_ques_id, ques_index)
            
            if save_html:
                html_file = Path(__file__).parent / f"aarav_test_{test_num}_q{ques_index}.html"
                with open(html_file, "w", encoding="utf-8") as f:
                    f.write(html)
            
            # 检查是否到达结果页面
            if "result" in html.lower() and len(html) < 100:
                print(f"  已到达测试结束")
                break
            
            # 解析题目
            q_data = parse_question_html(html, test_num, ques_index)
            
            # 获取正确答案
            if q_data["ques_id"]:
                q_data["answer"] = get_correct_answer(test_id, q_data["ques_id"])
            
            # 更新当前问题 ID
            if "next_ques_id" in q_data:
                current_ques_id = q_data.pop("next_ques_id")
            elif q_data["ques_id"]:
                current_ques_id = q_data["ques_id"]
            
            questions.append(q_data)
            stem_preview = q_data['stem'][:40] + "..." if len(q_data['stem']) > 40 else q_data['stem']
            print(f"  第 {ques_index} 题: {stem_preview} 答案: {q_data['answer']}")
            
        except Exception as e:
            print(f"  第 {ques_index} 题出错: {e}")
            import traceback
            traceback.print_exc()
    
    return questions


def scrape_all_tests(output_file: str = None, save_html: bool = False):
    """爬取所有测试"""
    all_questions = []
    
    if output_file is None:
        output_file = Path(__file__).parent.parent.parent.parent.parent / "aarav_c4_questions.json"
    
    for test_num in range(1, 8):
        try:
            questions = scrape_test(test_num, save_html)
            all_questions.extend(questions)
            print(f"  Test {test_num}: 提取了 {len(questions)} 道题目", flush=True)
            
            # 每完成一个测试就保存一次（增量保存）
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(all_questions, f, ensure_ascii=False, indent=2)
            print(f"  已保存进度到: {output_file}", flush=True)
            
            time.sleep(1)  # 测试间延迟
            
        except Exception as e:
            print(f"  Test {test_num} 出错: {e}", flush=True)
            import traceback
            traceback.print_exc()
            # 即使出错也保存已有数据
            if all_questions:
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(all_questions, f, ensure_ascii=False, indent=2)
                print(f"  已保存已爬取的 {len(all_questions)} 道题目", flush=True)
    
    print(f"\n总共提取了 {len(all_questions)} 道题目", flush=True)
    print(f"结果已保存到: {output_file}", flush=True)
    
    return all_questions


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="爬取 Aarav Driving School Class 4 练习题")
    parser.add_argument("--test", "-t", type=int, help="只爬取指定测试 (1-7)")
    parser.add_argument("--save-html", action="store_true", help="保存 HTML 文件供调试")
    parser.add_argument("--output", "-o", type=str, help="输出文件路径")
    
    args = parser.parse_args()
    
    import sys
    # 禁用输出缓冲
    sys.stdout.reconfigure(line_buffering=True)
    
    print("开始爬取 Aarav Driving School Class 4 练习题...", flush=True)
    print("=" * 60, flush=True)
    
    if args.test:
        # 只爬取指定测试
        questions = scrape_test(args.test, args.save_html)
        output_file = args.output or Path(__file__).parent.parent.parent.parent.parent / f"aarav_c4_test{args.test}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"\n提取了 {len(questions)} 道题目")
        print(f"结果已保存到: {output_file}")
    else:
        # 爬取所有测试
        scrape_all_tests(args.output, args.save_html)
