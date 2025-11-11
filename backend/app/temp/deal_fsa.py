from datetime import datetime
import re

input_file = "output.txt"
output_sql_file = "insert_fsa.sql"

now = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")

def escape_sql(value: str) -> str:
    """
    对 SQL 字符串进行转义，避免单引号导致语法错误
    """
    if value is None or value == "":
        return "NULL"
    return value.replace("'", "''").replace("\\", "\\\\")

def parse_line(line: str):
    parts = line.strip().split()
    if not parts:
        return ("", "", "", "")

    # 找到最后一个两位大写字母 -> province
    province_idx = None
    for i in range(len(parts)-1, -1, -1):
        if re.fullmatch(r"[A-Z]{2}", parts[i]):
            province_idx = i
            break

    province = parts[province_idx] if province_idx is not None else "NULL"

    # delivery_center_type 和 center_number
    delivery_center_type = ""
    center_number = ""
    if province_idx is not None:
        if province_idx + 1 < len(parts):
            delivery_center_type = parts[province_idx + 1]
        if province_idx + 2 < len(parts):
            center_number = parts[province_idx + 2]

    # fsa 是第一个
    fsa = parts[0]

    # city 是剩下的中间部分
    city_parts = parts[1:province_idx] if province_idx is not None else parts[1:]
    city = " ".join(city_parts)

    return fsa, city, province, delivery_center_type, center_number

with open(input_file, "r", encoding="utf-8") as f:
    lines = [line.rstrip() for line in f]

with open(output_sql_file, "w", encoding="utf-8") as f:
    for idx, line in enumerate(lines, start=1):
        fsa, city, province, delivery_center_type, center_number = parse_line(line)
        fsa_sql = escape_sql(fsa)
        city_sql = escape_sql(city)
        province_sql = escape_sql(province)
        delivery_center_type_sql = escape_sql(delivery_center_type)
        center_number_sql = escape_sql(center_number)

        sql = f"""INSERT INTO "fsa_manage" ("id", "fsa", "city", "province", "creator", "dept_id", "updater", "deleted", "create_time", "update_time", "delivery_center_type", "delivery_center_name", "center_number") VALUES
({idx}, '{fsa_sql}', '{city_sql}', '{province_sql}', NULL, NULL, NULL, '0', '{now}', '{now}', '{delivery_center_type_sql}', 'DEL CTR', '{center_number_sql}');"""

        f.write(sql + "\n")

print(f"SQL 已生成到 {output_sql_file}")
