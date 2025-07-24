# generator/model_extender.py
import os
from jinja2 import Environment, FileSystemLoader
from codegen.base.model import CURDModel
from typing import Optional

# 取当前文件的目录，定位 templates 目录绝对路径
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(template_name, context):
    template = env.get_template(template_name)
    return template.render(context)

def generate_backend_model(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "table_name": model.table_name,
        "fields": model.fields,
    }
    return render_template("common/backend/modules.jinja2", context)

def generate_backend_crud(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "fields": model.fields,
    }
    return render_template("single_module/backend/crud.jinja2", context)

def generate_backend_routes(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
    }
    return render_template("common/backend/routes.jinja2", context)

def generate_routes_main_content(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
    }
    return render_template("single_module/backend/main.jinja2", context)

def generate_backend_files(model: CURDModel, target_dir: Optional[str] = "codegen/target/single_module") -> dict:
    module_name = model.module_name
    generated_files = {}

    def record_code_file(rel_path: str, content: str):
        generated_files[rel_path] = content
        if target_dir is not None:
            abs_path = os.path.join(target_dir, rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)

    # 模型文件
    rel_model_path = os.path.join("backend", "app", "models", f"{module_name}.py")
    model_content = generate_backend_model(module_name, model)
    record_code_file(rel_model_path, model_content)

    # CRUD 文件
    rel_crud_path = os.path.join("backend", "app", "crud", f"{module_name}_crud.py")
    crud_content = generate_backend_crud(module_name, model)
    record_code_file(rel_crud_path, crud_content)

    # Routes 文件
    rel_routes_path = os.path.join("backend", "app", "api", "routes", f"{module_name}.py")
    routes_content = generate_backend_routes(module_name, model)
    record_code_file(rel_routes_path, routes_content)

    # main.py 路由注册
    rel_main_path = os.path.join("backend", "app", "api", "main_tmp.py")
    main_content = generate_routes_main_content(module_name, model)
    record_code_file(rel_main_path, main_content)

    return generated_files

