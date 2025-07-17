# generator/model_extender.py
import os
from jinja2 import Environment, FileSystemLoader
from base.model import CURDModel

env = Environment(
    loader=FileSystemLoader("templates"),
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(template_name, context):
    template = env.get_template(template_name)
    return template.render(context)

def generate_backend_model(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "fields": model.fields,
    }
    return render_template("backend/modules.jinja2", context)

def generate_backend_crud(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "fields": model.fields,
    }
    return render_template("backend/crud.jinja2", context)

def generate_backend_routes(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
    }
    return render_template("backend/routes.jinja2", context)

def generate_routes_main_content(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
    }
    return render_template("backend/main.jinja2", context)

def generate_backend_files(model: CURDModel, target_dir: str):
    module_name = model.module_name
    # 模型文件
    backend_models_dir = os.path.join(target_dir, "backend", "app", "models")
    os.makedirs(backend_models_dir, exist_ok=True)
    with open(os.path.join(backend_models_dir, f"{module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_model(module_name, model))

    # CRUD 文件
    backend_crud_dir = os.path.join(target_dir, "backend", "app", "crud")
    os.makedirs(backend_crud_dir, exist_ok=True)
    with open(os.path.join(backend_crud_dir, f"{module_name}_crud.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_crud(module_name, model))

    # Routes 文件
    backend_routes_dir = os.path.join(target_dir, "backend", "app", "api", "routes")
    os.makedirs(backend_routes_dir, exist_ok=True)
    with open(os.path.join(backend_routes_dir, f"{module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_routes(module_name, model))

    # main.py 路由注册
    main_dir = os.path.join(target_dir, "backend", "app", "api")
    os.makedirs(main_dir, exist_ok=True)
    with open(os.path.join(main_dir, "main_tmp.py"), "w", encoding="utf-8") as f:
        f.write(generate_routes_main_content(module_name, model))
