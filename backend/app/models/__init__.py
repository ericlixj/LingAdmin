# app/models/__init__.py
import importlib
import pkgutil
import pathlib

from sqlmodel import SQLModel

models_path = pathlib.Path(__file__).parent

for module_info in pkgutil.iter_modules([str(models_path)]):
    module_name = module_info.name
    if module_name == "__init__":
        continue
    print(f"Importing module: {__name__}.{module_name}")
    importlib.import_module(f"{__name__}.{module_name}")
