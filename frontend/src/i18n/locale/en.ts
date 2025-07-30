const en = {
  common: {
    fields: {
      id: "ID",
      creator: "Created By",
      updater: "Updated By",
      create_time: "Created At",
      update_time: "Updated At",
    },
    enums: {
      yes: "Yes",
      no: "No",
    },
    options: {
      enabled: "enabled",
      disabled: "disabled",
    },
    confirm: "Confirm",
    cancel: "Cancel",
    actions: "Actions",
  },
  login: {
    title: "LingAdmin Login",
    email: "Email",
    email_required: "Please enter your email",
    password: "Password",
    password_required: "Please enter your password",
    submit: "Login",
  },
  dashboard: {
    titles: {
      list: "Dashboard",
    },
  },
  system: {
    titles: {
      list: "System Management",
    },
  },
  user: {
    titles: {
      list: "User List",
      create: "Create User",
      edit: "Edit User",
      show: "User Details",
    },
    fields: {
      email: "Email",
      full_name: "Full Name",
      is_superuser: "Super User",
      is_active: "Active",
      create_time: "Created At",
    },
    filters: {
      email: "Search Email",
      full_name: "Search Full Name",
    },

    actions: {
      title: "Actions",
      bind_roles: "Bind Roles",
    },
    modal: {
      title: "Bind Roles",
      ok: "Bind",
      cancel: "Cancel",
    },
  },
  role: {
    titles: {
      list: "Role List",
      create: "Create Role",
      edit: "Edit Role",
      show: "Role Details",
    },
    fields: {
      code: "Role Code",
      name: "Role Name",
      description: "Role Description",
      data_scope: "Data Scope",
      shop_ids: "Select Shops",
    },
    enums: {
      data_scope: {
        all: "All Data Access",
        custom: "Custom Data Access",
      },
    },
    messages: {
      select_data_scope: "Please select data scope",
    },

    actions: {
      bind_permissions: "Bind Permissions",
    },
  },
  permission: {
    titles: {
      list: "Permission List",
      create: "Create Permission",
      edit: "Edit Permission",
      show: "Permission Details",
    },
    fields: {
      code: "Permission Code",
      name: "Permission Name",
      description: "Permission Description",
    },
    messages: {
      code_required: "Please enter permission code",
      name_required: "Please enter permission name",
    },
    filters: {
      code: "Search permission code",
      name: "Search permission name",
    },
  },
  infra: {
    titles: {
      list: "Infra",
    },
  },
  demo: {
    titles: {
      list: "Demo",
    },
  },
  buttons: {
    create: "Create",
    refresh: "Refresh",
    edit: "Edit",
    confirm: "Confirm Operation?",
    show: "View",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    filter: "Filter",
    clear: "Clear",
    export: "Export",
    logout: "Logout",
  },
  notifications: {
    success: "Operation succeeded",
    error: "Operation failed",
  },
  crudDefineModuel: {
    titles: {
      list: "CRUD Module Definitions List",
      create: "Create CRUD Module Definition",
      edit: "Edit CRUD Module Definition",
      show: "CRUD Module Definition Details",
    },
  },
  masterDetailRel: {
    titles: {
      list: "Master-Detail Relationship List",
      create: "Create Master-Detail Relationship",
      edit: "Edit Master-Detail Relationship",
      show: "Master-Detail Relationship Details",
    },
  },
  demoUser: {
    titles: {
      list: "Demo User List",
      create: "Create Demo User",
      edit: "Edit Demo User",
      show: "Demo User Details",
    },
  },
  sysDic: {
    titles: {
      list: "Dictionary List",
      create: "Create Dictionary",
      edit: "Edit Dictionary",
      show: "Dictionary Details",
    },
    fields: {
      dic_code: "Dictionary Code",
      dic_name: "Dictionary Name",
      status: "Status",
      remark: "Remark",
    },
    rules: {
      dic_code: {
        required: "Please enter the dictionary code",
        max: "Maximum 50 characters allowed",
      },
      dic_name: {
        required: "Please enter the dictionary name",
        max: "Maximum 100 characters allowed",
      },
      status: {
        required: "Please select status",
      },
      remark: {
        max: "Maximum 255 characters allowed",
      },
    },
    placeholders: {
      dic_code: "Search field code",
      dic_name: "Search dictionary name",
      status: "Please select status",
    },
    actions: {
      manage_children: "Manage sub-items",
    },

    options: {
      status: {
        "0": "Enabled",
        "1": "Disabled",
      },
    },
  },
  shop: {
    fields: {
      code: "Shop Code",
      name: "Shop Name",
    },
  },
  menu: {
      titles: {
          list: "Menu List",
          create: "Create PurchaseMenu",
          edit: "Edit Menu",
          show: "Menu Details",
      },
  },

};

export default en;
