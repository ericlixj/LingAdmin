import os
import shutil
import json
from base.model import CURDModel

from generator.backend_generator import generate_backend_files
from generator.frontend_generator import generate_frontend_files
from utils.json_loader import load_single_module_json

def process_modules(source_dir="source/modules", target_dir="target"):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    model = load_single_module_json(source_dir)
    module_name = model.module_name
    print(f"Processing module: {module_name}, label: {model.label or 'N/A'}")

    generate_backend_files(model, target_dir)
    generate_frontend_files(model, target_dir)


def main():
    process_modules()


if __name__ == "__main__":
    main()
