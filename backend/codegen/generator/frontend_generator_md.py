import os
from jinja2 import Environment, FileSystemLoader
from codegen.base.model import CURDModel, MasterDetailCURDModel

# Jinja2 模板引擎初始化
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

# 生成 App.tsx
def generate_frontend_app(model: CURDModel) -> tuple[str, str]:
    content = render_template("common/frontend/App.tsx.jinja2", {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "label": model.label or "",
    })
    path = os.path.join("frontend", "src", "App_tmp.tsx")
    return path, content

def generate_frontend_i18n_zh(model: CURDModel) -> tuple[str, str]:
    content = render_template("common/frontend/i18n_zh.ts.jinja2", {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "label": model.label or "",
    })
    path = os.path.join("frontend", "src", "i18n", "locale", "zh_tmp.ts")
    return path, content

def generate_frontend_i18n_en(model: CURDModel) -> tuple[str, str]:
    content = render_template("common/frontend/i18n_en.ts.jinja2", {
        "class_name": model.class_name,
        "module_name": model.module_name,
        "label": model.label or "",
    })
    path = os.path.join("frontend", "src", "i18n", "locale", "en_tmp.ts")
    return path, content

def generate_frontend_crud_pages(model: CURDModel) -> dict[str, str]:
    templates = {
        "common/frontend/create.tsx.jinja2": "create.tsx",
        "common/frontend/edit.tsx.jinja2": "edit.tsx",
        "master_detail_module/frontend/list.tsx.jinja2": "list.tsx",
        "common/frontend/index.ts.jinja2": "index.ts",
    }

    result = {}
    for tpl, filename in templates.items():
        content = render_template(tpl, {
            "class_name": model.class_name,
            "module_name": model.module_name,
            "fields": [f.dict() for f in model.fields],
        })
        path = os.path.join("frontend", "src", "pages", model.module_name, filename)
        result[path] = content
    return result

def generate_frontend_show_page(module: MasterDetailCURDModel) -> tuple[str, str]:
    master = module.master_module
    detail = module.detail_module

    content = render_template("master_detail_module/frontend/show.tsx.jinja2", {
        "master_module": master.dict(),
        "detail_module": detail.dict(),
        "relation_field": module.relation_field,
    })

    path = os.path.join("frontend", "src", "pages", master.module_name, "show.tsx")
    return path, content

def generate_detail_form_component(module: MasterDetailCURDModel) -> tuple[str, str]:
    master = module.master_module
    detail = module.detail_module

    content = render_template("master_detail_module/frontend/components/detailForm.tsx.jinja2", {
        "detail_module": detail,
        "relation_field": module.relation_field,
    })

    path = os.path.join(
        "frontend",
        "src",
        "pages",
        master.module_name,
        "components",
        f"{detail.module_name}.tsx"
    )
    return path, content

def generate_frontend_files(module: MasterDetailCURDModel, target_dir: str | None) -> dict[str, str]:
    print("\n🚀 Generating frontend files...")

    file_map: dict[str, str] = {}

    # App.tsx & i18nProvider
    path, content = generate_frontend_app(module.master_module)
    file_map[path] = content

    path, content = generate_frontend_i18n_zh(module.master_module)
    file_map[path] = content
    path, content = generate_frontend_i18n_en(module.master_module)
    file_map[path] = content    

    # CRUD 页面（不含 show）
    file_map.update(generate_frontend_crud_pages(module.master_module))

    # show 页面
    path, content = generate_frontend_show_page(module)
    file_map[path] = content

    # 子表组件
    path, content = generate_detail_form_component(module)
    file_map[path] = content

    if target_dir:
        for relative_path, content in file_map.items():
            full_path = os.path.join(target_dir, relative_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Generated: {full_path}")
        print("Frontend generation completed.\n")
    else:
        print("Dry run (no files written).")

    return file_map
