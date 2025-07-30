# generator/frontend_generator.py
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

def generate_frontend_App(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "label": model.label or "",
    }
    return render_template("common/frontend/App.tsx.jinja2", context)

def generate_frontend_i8n_zh(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "label": model.label or "",
    }
    return render_template("common/frontend/i18n_zh.ts.jinja2", context)

def generate_frontend_i8n_en(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "label": model.label or "",
    }
    return render_template("common/frontend/i18n_en.ts.jinja2", context)

def generate_frontend_files(model: CURDModel, target_dir: Optional[str] = "codegen/target/single_module") -> dict:
    module_name = model.module_name
    generated_files = {}

    def write_file(rel_path: str, content: str):
        generated_files[rel_path] = content
        if target_dir is not None:
            abs_path = os.path.join(target_dir, rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)

    # App_tmp.tsx
    rel_app_path = os.path.join("frontend", "src", "App_tmp.tsx")
    app_content = generate_frontend_App(module_name, model)
    write_file(rel_app_path, app_content)

    # zh_tmp.ts
    rel_i18n_path = os.path.join("frontend", "src", "i18n", "locale", "zh_tmp.ts")
    i18n_content = generate_frontend_i8n_zh(module_name, model)
    write_file(rel_i18n_path, i18n_content)

    # en_tmp.ts
    rel_i18n_path1 = os.path.join("frontend", "src", "i18n", "locale", "en_tmp.ts")
    i18n_content1 = generate_frontend_i8n_en(module_name, model)
    write_file(rel_i18n_path1, i18n_content1)    

    # 页面部分
    pages = {
        "common/frontend/create.tsx.jinja2": "create.tsx",
        "common/frontend/edit.tsx.jinja2": "edit.tsx",
        "single_module/frontend/list.tsx.jinja2": "list.tsx",
        "single_module/frontend/show.tsx.jinja2": "show.tsx",
        "common/frontend/index.ts.jinja2": "index.ts",
    }

    for template_file, filename in pages.items():
        content = render_template(template_file, {
            "class_name": model.class_name,
            "fields": [f.dict() for f in model.fields],
            "module_name": module_name,
        })
        rel_page_path = os.path.join("frontend", "src", "pages", module_name, filename)
        write_file(rel_page_path, content)

    return generated_files
