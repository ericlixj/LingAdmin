import os
import json
from app.codegen.base.model import CURDModel, MasterDetailCURDModel

def load_single_module_json(source_dir: str) -> CURDModel:
    json_path = os.path.join(source_dir, "single_module_define.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"{json_path} does not exist")

    with open(json_path, encoding="utf-8") as f:
        model_data = json.load(f)

    model = CURDModel(**model_data)
    print(json.dumps(model.model_dump(), indent=2, ensure_ascii=False))
    return model


def load_master_detail_json(source_dir: str) -> MasterDetailCURDModel:
    json_filename = "master_detail_module_define.json"
    json_path = os.path.join(source_dir, json_filename)

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"{json_filename} 不存在于目录: {source_dir}")

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    try:
        model = MasterDetailCURDModel(**data)
    except Exception as e:
        raise ValueError(f"解析 JSON 文件失败: {e}")

    # print(json.dumps(model.model_dump(), indent=2, ensure_ascii=False))
    return model