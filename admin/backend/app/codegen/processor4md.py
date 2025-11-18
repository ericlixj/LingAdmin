# processor.py

import os
import shutil
from app.codegen.base.model import MasterDetailCURDModel
from app.codegen.generator.backend_generator_md import generate_backend_files
from app.codegen.generator.frontend_generator_md import generate_frontend_files
from app.codegen.utils.json_loader import load_single_module_json

def process_model(model: MasterDetailCURDModel, target_dir: str = "target/single_module") -> dict:
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    print(f"Processing module: {model.module_name}, label: {model.label or 'N/A'}")

    backend_files = generate_backend_files(model, target_dir)
    frontend_files = generate_frontend_files(model, target_dir)

    return {**backend_files, **frontend_files}

def process_model_in_memory(model: MasterDetailCURDModel) -> dict:
    """不写入文件，仅返回内存中的文件名-内容映射"""
    backend_files = generate_backend_files(model, target_dir=None)
    frontend_files = generate_frontend_files(model, target_dir=None)
    return {**backend_files, **frontend_files}


def process_module_from_file(source_file: str = "source/modules") -> dict:
    model = load_single_module_json(source_file)
    return process_model(model)

def process_module_from_dict(model_data: dict) -> dict:
    model = MasterDetailCURDModel.model_validate(model_data)
    return process_model_in_memory(model)

# 可选 CLI 支持
def main():
    process_module_from_file()

if __name__ == "__main__":
    main()
