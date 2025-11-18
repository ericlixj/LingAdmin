import ast
from typing import Optional, List, Dict

COMMON_FIELDS = {"id", "creator", "updater", "deleted", "create_time", "update_time"}
def parse_sqlmodel_source(source_code: str) -> Dict:
    """
    解析SQLModel源代码，提取模型类及其字段信息。
    返回结构：
    {
        "models": [
            {
                "class_name": "App",
                "label": "应用",
                "fields": [
                    { ... }
                ]
            }
        ]
    }
    """
    tree = ast.parse(source_code)
    models = []

    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            # 只处理继承SQLModel的类
            bases = [b.id if isinstance(b, ast.Name) else None for b in node.bases]
            if "SQLModel" not in bases:
                continue

            model = {
                "class_name": node.name,
                "label": None,
                "fields": []
            }

            # 提取 class App(SQLModel, table=True, label="应用") 中的 label
            if node.keywords:
                for kw in node.keywords:
                    if kw.arg == "label" and isinstance(kw.value, ast.Constant):
                        model["label"] = kw.value.value

            for stmt in node.body:
                if isinstance(stmt, ast.AnnAssign):
                    field_name = stmt.target.id

                    if isinstance(stmt.annotation, ast.Subscript):
                        base = stmt.annotation.value.id
                        sub = getattr(stmt.annotation.slice, 'id', None) or getattr(stmt.annotation.slice.value, 'id', None)
                        field_type = f"{base}[{sub}]"
                    elif isinstance(stmt.annotation, ast.Name):
                        field_type = stmt.annotation.id
                    else:
                        field_type = None

                    default = None
                    primary_key = False
                    max_length = None
                    index = False
                    unique = False
                    description = None

                    if isinstance(stmt.value, ast.Call) and getattr(stmt.value.func, 'id', '') == "Field":
                        for kw in stmt.value.keywords:
                            if kw.arg == "default":
                                # 判断 default 值是否有效
                                if isinstance(kw.value, ast.Constant):
                                    # kw.value.value 有可能是 None 或具体值
                                    if kw.value.value is not None:
                                        default = kw.value.value
                                    else:
                                        default = None  # 明确赋None，后续模板可以判断跳过
                                elif isinstance(kw.value, ast.NameConstant):  # Python 3.7 以下写法兼容
                                    default = kw.value.value
                                else:
                                    # 复杂表达式用 ast.unparse 转为字符串
                                    default_str = ast.unparse(kw.value)
                                    if default_str and default_str != "None":
                                        default = default_str
                                    else:
                                        default = None
                            elif kw.arg == "primary_key" and isinstance(kw.value, ast.Constant):
                                primary_key = kw.value.value
                            elif kw.arg == "max_length" and isinstance(kw.value, ast.Constant):
                                max_length = kw.value.value
                            elif kw.arg == "index" and isinstance(kw.value, ast.Constant):
                                index = kw.value.value
                            elif kw.arg == "unique" and isinstance(kw.value, ast.Constant):
                                unique = kw.value.value
                            elif kw.arg == "description" and isinstance(kw.value, ast.Constant):
                                description = kw.value.value

                    model["fields"].append({
                        "name": field_name,
                        "type": field_type,
                        "default": default,
                        "primary_key": primary_key,
                        "max_length": max_length,
                        "index": index,
                        "unique": unique,
                        "description": description,
                        "common": field_name in COMMON_FIELDS,
                    })

            models.append(model)

    return {"models": models}
