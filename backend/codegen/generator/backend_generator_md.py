# generator/model_extender.py
import os
from jinja2 import Environment, FileSystemLoader
from codegen.base.model import MasterDetailCURDModel, CURDModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates", "master_detail_module")

env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
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
    return render_template("backend/modules.jinja2", context)

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
    return render_template("backend/crud.jinja2", context)

def generate_backend_routes(model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": model.module_name,
    }
    return render_template("backend/routes.jinja2", context)

def generate_routes_main_content(master_model: CURDModel, detail_model: CURDModel) -> str:
    context = {
        "master_class_name": master_model.class_name,
        "master_module_name": master_model.module_name,
        "detail_class_name": detail_model.class_name,
        "detail_module_name": detail_model.module_name,
    }
    return render_template("backend/main.jinja2", context)

def generate_backend_files(module: MasterDetailCURDModel, target_dir: str | None):
    print("\n🚀 Generating backend files...")

    master_module = module.master_module
    detail_module = module.detail_module
    relation_field = module.relation_field

    file_map: dict[str, str] = {}

    # 模型文件
    backend_models_dir = os.path.join("backend", "app", "models")
    master_model_path = os.path.join(backend_models_dir, f"{master_module.module_name}.py")
    detail_model_path = os.path.join(backend_models_dir, f"{detail_module.module_name}.py")

    file_map[master_model_path] = generate_backend_model(master_module)
    file_map[detail_model_path] = generate_backend_model(detail_module)

    # CRUD 文件
    backend_crud_dir = os.path.join("backend", "app", "crud")
    master_crud_path = os.path.join(backend_crud_dir, f"{master_module.module_name}_crud.py")
    detail_crud_path = os.path.join(backend_crud_dir, f"{detail_module.module_name}_crud.py")

    file_map[master_crud_path] = generate_backend_crud(
        master_module,
        isMaster=True,
        detail_module_name=detail_module.module_name,
        detail_class_name=detail_module.class_name,
        relation_field=relation_field,
    )
    file_map[detail_crud_path] = generate_backend_crud(
        detail_module,
        isMaster=False,
        detail_module_name=detail_module.module_name,
        detail_class_name=master_module.class_name,
        relation_field=relation_field,
    )

    # Routes 文件
    backend_routes_dir = os.path.join("backend", "app", "api", "routes")
    master_route_path = os.path.join(backend_routes_dir, f"{master_module.module_name}.py")
    detail_route_path = os.path.join(backend_routes_dir, f"{detail_module.module_name}.py")

    file_map[master_route_path] = generate_backend_routes(master_module)
    file_map[detail_route_path] = generate_backend_routes(detail_module)

    # main.py 路由注册
    main_dir = os.path.join("backend", "app", "api")
    main_file_path = os.path.join(main_dir, "main_tmp.py")

    file_map[main_file_path] = generate_routes_main_content(master_module, detail_module)

    # 若指定 target_dir，则执行实际写入
    if target_dir:
        for relative_path, content in file_map.items():
            full_path = os.path.join(target_dir, relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
        print("Backend generation completed.\n")
    else:
        print("Dry run (no files written).")

    return file_map