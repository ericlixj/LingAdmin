from enum import Enum

class DataScopeType(int, Enum):
    ALL = 0               # 全部数据权限
    CUSTOM = 1            # 指定部门
    DEPT_ONLY = 2         # 本部门
    DEPT_AND_SUB = 3      # 本部门及以下
    SELF_ONLY = 4         # 仅本人
