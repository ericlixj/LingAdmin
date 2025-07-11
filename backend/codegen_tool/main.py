import os
import shutil
from jinja2 import Environment, FileSystemLoader
from utils.parser import parse_sqlmodel_source

def render_template(template_name, context):
    env = Environment(
        loader=FileSystemLoader("templates"),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    template = env.get_template(template_name)
    return template.render(context)

def generate_backend_model(module_name, model):
    context = {
        "class_name": model["class_name"],
        "fields": model["fields"],
    }
    return render_template("backend/modules.jinja2", context)

def generate_backend_crud(module_name, model):
    context = {
        "class_name": model["class_name"],
        "module_name": module_name,
    }
    return render_template("backend/crud.jinja2", context)

def generate_backend_routes(module_name, model):
    context = {
        "class_name": model["class_name"],
        "module_name": module_name,
    }
    return render_template("backend/routes.jinja2", context)

def generate_routes_main_content(module_name, model):
    context = {
        "class_name": model["class_name"],
        "module_name": module_name,
    }
    return render_template("backend/main.jinja2", context)

def generate_frontend_App(module_name, model):
    context = {
        "class_name": model["class_name"],
        "module_name": module_name,
        "label": model.get("label", ""),
    }
    return render_template("frontend/App.tsx.jinjia2", context)

def generate_frontend_pages(module_name, model, target_dir):
    """
    生成一个模块的所有前端页面（Create, Edit, List, Show）。
    输出目录为 frontend/src/pages/{module_name}/
    """
    pages = {
        "frontend/create.tsx.jinja2": f"create.tsx",
        "frontend/edit.tsx.jinja2": f"edit.tsx",
        "frontend/list.tsx.jinja2": f"list.tsx",
        "frontend/show.tsx.jinja2": f"show.tsx",
        "frontend/index.tsx.jinja2": f"index.tsx",
    }

    pages_dir = os.path.join(target_dir,"frontend", "src", "pages", module_name)
    os.makedirs(pages_dir, exist_ok=True)

    for template_file, filename in pages.items():
        content = render_template(template_file, {
            "class_name": model["class_name"],
            "fields": model["fields"],
            "module_name": module_name,
        })

        filepath = os.path.join(pages_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f_out:
            f_out.write(content)

        print(f"Generated frontend page: {filepath}")


def process_modules(source_dir="source/modules", target_dir="target"):
    if os.path.exists(target_dir):
        shutil.rmtree(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    for filename in os.listdir(source_dir):
        if not filename.endswith(".py"):
            continue

        module_name = filename[:-3]
        path = os.path.join(source_dir, filename)
        with open(path, encoding="utf-8") as f:
            source_code = f.read()

        parsed = parse_sqlmodel_source(source_code)
        if not parsed["models"]:
            print(f"No SQLModel classes found in {filename}")
            continue

        model = parsed["models"][0]
        #print model label
        print(f"Processing module: {module_name}, label: {model.get('label', 'N/A')}")


        # 生成后端模型文件
        backend_models_dir = os.path.join(target_dir, "backend", "app", "models")
        os.makedirs(backend_models_dir, exist_ok=True)

        backend_model_code = generate_backend_model(module_name, model)
        model_file_path = os.path.join(backend_models_dir, f"{module_name}.py")

        with open(model_file_path, "w", encoding="utf-8") as f_out:
            f_out.write(backend_model_code)

        print(f"Generated backend model for {module_name} at {model_file_path}")

        # 生成 CRUD 文件
        backend_crud_dir = os.path.join(target_dir, "backend", "app", "crud")
        os.makedirs(backend_crud_dir, exist_ok=True)

        backend_crud_code = generate_backend_crud(module_name, model)
        crud_file_path = os.path.join(backend_crud_dir, f"{module_name}_crud.py")

        with open(crud_file_path, "w", encoding="utf-8") as f_out:
            f_out.write(backend_crud_code)

        print(f"Generated backend crud for {module_name} at {crud_file_path}")

        # 生成路由文件
        backend_routes_dir = os.path.join(target_dir, "backend", "app", "routes","api")
        os.makedirs(backend_routes_dir, exist_ok=True)      

        backend_routes_code = generate_backend_routes(module_name, model)
        routes_file_path = os.path.join(backend_routes_dir, f"{module_name}.py") 
        with open(routes_file_path, "w", encoding="utf-8") as f_out:
            f_out.write(backend_routes_code)

        print(f"Generated backend routes for {module_name} at {routes_file_path}")

        # 生成 main.py 中的路由注册
        routes_main_content = generate_routes_main_content(module_name, model)
        routes_main_path = os.path.join(backend_routes_dir, f"main_tmp.py") 
        with open(routes_main_path, "w", encoding="utf-8") as f_out:
            f_out.write(routes_main_content)

        print(f"Generated backend routes main.py for {module_name}")

        # 生成前端 App.tsx 文件
        frontend_dir = os.path.join(target_dir, "frontend", "src")
        os.makedirs(frontend_dir, exist_ok=True)

        frontend_app_code = generate_frontend_App(module_name, model)
        app_file_path = os.path.join(frontend_dir, f"App_tmp.tsx")

        with open(app_file_path, "w", encoding="utf-8") as f_out:
            f_out.write(frontend_app_code)
        print(f"Generated frontend App.tsx for {module_name} at {app_file_path}")
        
        generate_frontend_pages(module_name, model, "target")

def main():
    process_modules()

if __name__ == "__main__":
    main()
