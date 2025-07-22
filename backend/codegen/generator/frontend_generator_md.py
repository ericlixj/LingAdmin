import os
from jinja2 import Environment, FileSystemLoader
from codegen.base.model import CURDModel, MasterDetailCURDModel

# Jinja2 模板引擎初始化
env = Environment(
    loader=FileSystemLoader("templates/master_detail_module/frontend"),
    trim_blocks=True,
    lstrip_blocks=True,
)

def render_template(template_name, context):
    template = env.get_template(template_name)
    return template.render(context)

# 生成 App.tsx
def generate_frontend_app(model: CURDModel, target_dir: str):
    content = render_template("App.tsx.jinja2", {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "label": model.label or "",
    })

    path = os.path.join(target_dir, "frontend", "src", "App_tmp.tsx")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {path}")

# 生成 i18nProvider.ts
def generate_frontend_i18n(model: CURDModel, target_dir: str):
    content = render_template("i18nProvider.ts.jinja2", {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "label": model.label or "",
    })

    path = os.path.join(target_dir, "frontend", "src", "i18nProvider_tmp.ts")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {path}")

# 生成 CRUD 页面（不含 show）
def generate_frontend_crud_pages(model: CURDModel, target_dir: str):
    templates = {
        "create.tsx.jinja2": "create.tsx",
        "edit.tsx.jinja2": "edit.tsx",
        "list.tsx.jinja2": "list.tsx",
        "index.tsx.jinja2": "index.tsx",
    }

    pages_dir = os.path.join(target_dir, "frontend", "src", "pages", model.module_name)
    os.makedirs(pages_dir, exist_ok=True)

    for tpl, filename in templates.items():
        content = render_template(tpl, {
            "class_name": model.class_name,
            "module_name": model.module_name,
            "fields": [f.dict() for f in model.fields],
        })
        path = os.path.join(pages_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated: {path}")

# 生成 show 页面（主子表）
def generate_frontend_show_page(module: MasterDetailCURDModel, target_dir: str):
    master = module.master_module
    detail = module.detail_module

    content = render_template("show.tsx.jinja2", {
        "master_module": master.dict(),
        "detail_module": detail.dict(),
        "relation_field": module.relation_field,
    })

    path = os.path.join(target_dir, "frontend", "src", "pages", master.module_name, "show.tsx")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {path}")

# 生成 detail 子表表单组件
def generate_detail_form_component(module: MasterDetailCURDModel, target_dir: str):
    master = module.master_module
    detail = module.detail_module

    content = render_template("components/detailForm.tsx.jinja2", {
        "detail_module": detail,
        "relation_field": module.relation_field,
    })

    path = os.path.join(
    target_dir,
    "frontend",
    "src",
    "pages",
    master.module_name,
    "components",
    f"{detail.module_name}.tsx"
)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {path}")

# 前端主入口：一键生成
def generate_frontend_files(module: MasterDetailCURDModel, target_dir: str):
    print("\n Generating frontend files...")

    generate_frontend_app(module.master_module, target_dir)
    generate_frontend_i18n(module.master_module, target_dir)
    generate_frontend_crud_pages(module.master_module, target_dir)
    generate_frontend_show_page(module, target_dir)
    generate_detail_form_component(module, target_dir)

    print("Frontend generation completed.\n")
