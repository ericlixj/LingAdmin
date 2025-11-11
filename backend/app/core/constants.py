from enum import Enum

# Constants for the application
SUPER_ADMIN_DEPT_ID = -9999
SUPER_ADMIN_ROLE_ID = 1
SUPER_ADMIN_PERMISSION_ID = 1
SUPER_ADMIN_USER_ID = 1



class DataScopeType(int, Enum):
    ALL = 0               # 全部数据权限
    CUSTOM = 1            # 指定部门
    DEPT_ONLY = 2         # 本部门
    DEPT_AND_SUB = 3      # 本部门及以下
    SELF_ONLY = 4         # 仅本人