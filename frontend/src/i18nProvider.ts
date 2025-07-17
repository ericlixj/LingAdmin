
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
    app: {
        titles: {
            list: "应用列表",
            create: "创建应用",
            edit: "编辑应用",
            show: "应用详情",
        },
    },

    shop: {
        titles: {
            list: "店铺列表",
            create: "创建店铺",
            edit: "编辑店铺",
            show: "店铺详情",
        },
    },  
    "shop-daily-stat": {
        titles: {
            list: "店铺日报列表",
            create: "创建店铺日报",
            edit: "编辑店铺日报",
            show: "店铺日报详情",
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
    appNew: {
        titles: {
            list: "应用管理New列表",
            create: "创建应用管理New",
            edit: "编辑应用管理New",
            show: "应用管理New详情",
        },
    },    
    appNew2: {
        titles: {
            list: "应用管理New2列表",
            create: "创建应用管理New2",
            edit: "编辑应用管理New2",
            show: "应用管理New2详情",
        },
    },
    appNew3: {
        titles: {
            list: "应用管理New3列表",
            create: "创建应用管理New3",
            edit: "编辑应用管理New3",
            show: "应用管理New3详情",
        },
    },    
    appNew4: {
        titles: {
            list: "应用管理New4列表",
            create: "创建应用管理New4",
            edit: "编辑应用管理New4",
            show: "应用管理New4详情",
        },
    },    
    appNew5: {
        titles: {
            list: "应用管理New5列表",
            create: "创建应用管理New5",
            edit: "编辑应用管理New5",
            show: "应用管理New5详情",
        },
    },
    curdModel001: {
        titles: {
            list: "单表模型01管理列表",
            create: "创建单表模型01管理",
            edit: "编辑单表模型01管理",
            show: "单表模型01管理详情",
        },
    },
    curdModel02: {
        titles: {
            list: "单表模型02管理列表",
            create: "创建单表模型02管理",
            edit: "编辑单表模型02管理",
            show: "单表模型02管理详情",
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