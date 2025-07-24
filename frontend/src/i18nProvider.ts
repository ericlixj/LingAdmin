
const translations = {
    user: {
        titles: {
            list: "用户列表",
            create: "创建用户",
            edit: "编辑用户",
            show: "用户详情",
        },
    },
    role: {
        titles: {
            list: "角色列表",
            create: "创建角色",
            edit: "编辑角色",
            show: "角色详情",
        },
    },
    permission: {
        titles: {
            list: "权限列表",
            create: "创建权限",
            edit: "编辑权限",
            show: "权限详情",
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
        error: "操作失败"
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
    },    
  
};
const i18nProvider = {
    translate: (key, params) => {
        const keys = key.split(".");
        let result: any = translations;

        for (const k of keys) {
            result = result?.[k];
            if (!result) return key;
        }

        if (params) {
            Object.keys(params).forEach((param) => {
                result = result.replace(`:${param}`, params[param]);
            });
        }

        return result;
    },
    changeLocale: () => Promise.resolve(),
    getLocale: () => "zh",
};

export default i18nProvider;