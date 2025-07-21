import os
import shutil
import json
from base.model import CURDModel

from generator.backend_generator_md import generate_backend_files
from generator.frontend_generator_md import generate_frontend_files
from utils.json_loader import load_master_detail_json

def process_modules(source_dir="source/modules", target_dir="target/master_detail_module"):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    model = load_master_detail_json(source_dir)
    master_module_name = model.master_module.module_name
    detail_module_name = model.detail_module.module_name
    relation_field = model.relation_field

    print(f"Processing master module: {master_module_name}")
    print(f"Processing detail module: {detail_module_name}")
    print(f"Relation field: {relation_field}")

    generate_backend_files(model, target_dir)
    generate_frontend_files(model, target_dir)


def main():
    process_modules()


if __name__ == "__main__":
    main()
