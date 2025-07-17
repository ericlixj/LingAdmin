import os
import json
from base.model import CURDModel

def load_single_module_json(source_dir: str) -> CURDModel:
    """
    从 source_dir 目录读取单个 JSON 文件并解析成 CURDModel 实例。
    目录中允许且只能有一个 JSON 文件。
    """
    json_files = [f for f in os.listdir(source_dir) if f.endswith(".json")]

    if not json_files:
        raise FileNotFoundError(f"No .json file found in {source_dir}")
    if len(json_files) > 1:
        raise ValueError(f"Only one .json file is allowed in {source_dir}, found: {json_files}")

    json_path = os.path.join(source_dir, json_files[0])
    with open(json_path, encoding="utf-8") as f:
        model_data = json.load(f)

    model = CURDModel(**model_data)
    print(json.dumps(model.model_dump(), indent=2, ensure_ascii=False))
    return model
