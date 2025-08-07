const zh = {
  common: {
    fields: {
      id: "ID",
      creator: "创建人",
      updater: "更新人",
      create_time: "创建时间",
      update_time: "更新时间",
    },
    enums: {
      yes: "是",
      no: "否",
    },
    options: {
      enabled: "开启",
      disabled: "关闭",
    },
    confirm: "绑定",
    cancel: "取消",
    actions: "操作",
  },
  login: {
    title: "LingAdmin 登录",
    email: "邮箱",
    email_required: "请输入注册邮箱",
    password: "密码",
    password_required: "请输入密码",
    submit: "登录",
  },
  dashboard: {
    titles: {
      list: "首页",
    },
  },
  system: {
    titles: {
      list: "系统管理",
    },
  },
  user: {
    titles: {
      list: "用户列表",
      create: "创建用户",
      edit: "编辑用户",
      show: "用户详情",
    },
    fields: {
      email: "注册邮箱",
      full_name: "全名",
      dept: "所属部门",
      is_active: "是否激活",
      is_superuser: "是否超级管理员",
      create_time: "创建时间",
    },
    filters: {
      email: "搜索邮箱",
      full_name: "搜索全名",
    },

    actions: {
      title: "操作",
      bind_roles: "绑定角色",
    },
    modal: {
      title: "绑定角色",
      ok: "绑定",
      cancel: "取消",
    },
  },
  role: {
    titles: {
      list: "角色列表",
      create: "创建角色",
      edit: "编辑角色",
      show: "角色详情",
    },
    fields: {
      code: "角色编码",
      name: "角色名称",
      description: "角色描述",
      data_scope: "数据范围",
      shop_ids: "选择店铺",
    },
    enums: {
      data_scope: {
        all: "全部",
        custom: "自定义",
        dept_only: "本部门",
        dept_and_sub: "本部门及以下",
        self_only: "仅本人",
      },
    },
    messages: {
      select_data_scope: "请选择数据范围",
    },

    actions: {
      bind_permissions: "菜单权限",
      bind_data_permissions: "数据权限",
    },
  },
  permission: {
    titles: {
      list: "权限列表",
      create: "创建权限",
      edit: "编辑权限",
      show: "权限详情",
    },
    fields: {
      code: "权限编码",
      name: "权限名称",
      description: "权限描述",
    },
    messages: {
      code_required: "请输入权限编码",
      name_required: "请输入权限名称",
    },
    filters: {
      code: "搜索权限编码",
      name: "搜索权限名称",
    },
  },
  infra: {
    titles: {
      list: "基础设置",
    },
  },
  demo: {
    titles: {
      list: "演示",
    },
  },
  buttons: {
    create: "新增",
    refresh: "刷新",
    edit: "编辑",
    confirm: "确认操作否？",
    show: "查看",
    delete: "删除",
    save: "保存",
    cancel: "取消",
    submit: "提交",
    filter: "筛选",
    clear: "清除",
    export: "导出",
    logout: "退出",
  },
  notifications: {
    success: "操作成功",
    error: "操作失败",
  },
  crudDefineModuel: {
    titles: {
      list: "CRUD模块定义列表",
      create: "创建CRUD模块定义",
      edit: "编辑CRUD模块定义",
      show: "CRUD模块定义详情",
    },
  },
  masterDetailRel: {
    titles: {
      list: "主子表关系列表",
      create: "创建主子表关系",
      edit: "编辑主子表关系",
      show: "主子表关系详情",
    },
  },
  demoUser: {
    titles: {
      list: "演示用户列表",
      create: "创建演示用户",
      edit: "编辑演示用户",
      show: "演示用户详情",
    },
  },
  sysDic: {
    titles: {
      list: "字典表列表",
      create: "创建字典表",
      edit: "编辑字典表",
      show: "字典表详情",
    },
    fields: {
      dic_code: "字段编码",
      dic_name: "字典名称",
      status: "状态",
      remark: "备注",
    },
    rules: {
      dic_code: {
        required: "请输入字段编码",
        max: "最多输入 50 个字符",
      },
      dic_name: {
        required: "请输入字典名称",
        max: "最多输入 100 个字符",
      },
      status: {
        required: "请选择状态",
      },
      remark: {
        max: "最多输入 255 个字符",
      },
    },
    placeholders: {
      dic_code: "搜索字段编码",
      dic_name: "搜索字典名称",
      status: "请选择状态",
    },
    actions: {
      manage_children: "子表管理",
    },
    options: {
      status: {
        "0": "开启",
        "1": "关闭",
      },
    },
  },
  shop: {
    fields: {
      code: "店铺编码",
      name: "店铺名称",
    },
  },
  menu: {
    titles: {
      list: "菜单列表",
      create: "创建菜单",
      edit: "编辑菜单",
      show: "菜单详情",
    },
  },
  demoUser001: {
    titles: {
      list: "演示用户001列表",
      create: "创建演示用户001",
      edit: "编辑演示用户001",
      show: "演示用户001详情",
    },
  },
  dept: {
    titles: {
      list: "部门管理列表",
      create: "创建部门管理",
      edit: "编辑部门管理",
      show: "部门管理详情",
    },
  },
  sysDic001: {
    titles: {
      list: "字典表001列表",
      create: "创建字典表001",
      edit: "编辑字典表001",
      show: "字典表001详情",
    },
  },
  demoUser002: {
    titles: {
      list: "演示用户002列表",
      create: "创建演示用户002",
      edit: "编辑演示用户002",
      show: "演示用户002详情",
    },
  },
};

export default zh;
