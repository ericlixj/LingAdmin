# generator/frontend_generator.py
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

def generate_frontend_App(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "label": model.label or "",
    }
    return render_template("frontend/App.tsx.jinjia2", context)

def generate_frontend_i8n(module_name: str, model: CURDModel) -> str:
    context = {
        "class_name": model.class_name,
        "module_name": module_name,
        "label": model.label or "",
    }
    return render_template("frontend/i18nProvider.ts.jinjia2", context)

def generate_frontend_pages(module_name: str, model: CURDModel, target_dir: str):
    pages = {
        "frontend/create.tsx.jinja2": "create.tsx",
        "frontend/edit.tsx.jinja2": "edit.tsx",
        "frontend/list.tsx.jinja2": "list.tsx",
        "frontend/show.tsx.jinja2": "show.tsx",
        "frontend/index.tsx.jinja2": "index.tsx",
    }

    pages_dir = os.path.join(target_dir, "frontend", "src", "pages", module_name)
    os.makedirs(pages_dir, exist_ok=True)

    for template_file, filename in pages.items():
        content = render_template(template_file, {
            "class_name": model.class_name,
            "fields": [f.dict() for f in model.fields],
            "module_name": module_name,
        })

        filepath = os.path.join(pages_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f_out:
            f_out.write(content)

        print(f"Generated frontend page: {filepath}")

def generate_frontend_files(model: CURDModel, target_dir: str):
    module_name = model.module_name
    frontend_dir = os.path.join(target_dir, "frontend", "src")
    os.makedirs(frontend_dir, exist_ok=True)

    with open(os.path.join(frontend_dir, "App_tmp.tsx"), "w", encoding="utf-8") as f:
        f.write(generate_frontend_App(module_name, model))

    with open(os.path.join(frontend_dir, "i18nProvider_TMP.ts"), "w", encoding="utf-8") as f:
        f.write(generate_frontend_i8n(module_name, model))

    generate_frontend_pages(module_name, model, target_dir)
