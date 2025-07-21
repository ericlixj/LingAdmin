# generator/model_extender.py
import os
from jinja2 import Environment, FileSystemLoader
from base.model import MasterDetailCURDModel, CURDModel

env = Environment(
    loader=FileSystemLoader("templates/master_detail_module/backend"),
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(template_name, context):
    template = env.get_template(template_name)
    return template.render(context)

def generate_backend_model(model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "fields": model.fields,
    }
    return render_template("modules.jinja2", context)

def generate_backend_crud(model: CURDModel, isMaster: bool, detail_class_name: str, detail_module_name: str, relation_field: str) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "fields": model.fields,
        "is_master": isMaster,
        "detail_class_name": detail_class_name,
        "detail_module_name": detail_module_name,
        "relation_field": relation_field,
    }
    return render_template("crud.jinja2", context)

def generate_backend_routes(model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": model.module_name,
    }
    return render_template("routes.jinja2", context)

def generate_routes_main_content(master_model: CURDModel, detail_model: CURDModel) -> str:
    context = {
        "master_class_name": master_model.class_name,
        "master_module_name": master_model.module_name,
        "detail_class_name": detail_model.class_name,
        "detail_module_name": detail_model.module_name,
    }
    return render_template("main.jinja2", context)

def generate_backend_files(module: MasterDetailCURDModel, target_dir: str):
    print("\n🚀 Generating backend files...")
    master_module = module.master_module
    detail_module = module.detail_module
    relation_field = module.relation_field

    # 模型文件
    backend_models_dir = os.path.join(target_dir, "backend", "app", "models")
    os.makedirs(backend_models_dir, exist_ok=True)

    with open(os.path.join(backend_models_dir, f"{master_module.module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_model( master_module))
    with open(os.path.join(backend_models_dir, f"{detail_module.module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_model( detail_module))        

    # CRUD 文件
    backend_crud_dir = os.path.join(target_dir, "backend", "app", "crud")
    os.makedirs(backend_crud_dir, exist_ok=True)

    with open(os.path.join(backend_crud_dir, f"{master_module.module_name}_crud.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_crud(master_module, isMaster=True,detail_module_name=detail_module.module_name,detail_class_name=detail_module.class_name, relation_field=relation_field))
    with open(os.path.join(backend_crud_dir, f"{detail_module.module_name}_crud.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_crud(detail_module, isMaster=False, detail_class_name=master_module.class_name,detail_module_name=detail_module.module_name, relation_field=relation_field))        

    # Routes 文件
    backend_routes_dir = os.path.join(target_dir, "backend", "app", "api", "routes")
    os.makedirs(backend_routes_dir, exist_ok=True)
    with open(os.path.join(backend_routes_dir, f"{master_module.module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_routes(master_module))
    with open(os.path.join(backend_routes_dir, f"{detail_module.module_name}.py"), "w", encoding="utf-8") as f:
        f.write(generate_backend_routes(detail_module))
    # main.py 路由注册
    main_dir = os.path.join(target_dir, "backend", "app", "api")
    os.makedirs(main_dir, exist_ok=True)
    with open(os.path.join(main_dir, "main_tmp.py"), "w", encoding="utf-8") as f:
        f.write(generate_routes_main_content(master_module, detail_module))
    print("Backend generation completed.\n")