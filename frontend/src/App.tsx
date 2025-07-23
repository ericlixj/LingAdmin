
import {
  ApiOutlined,
  BarChartOutlined,
  DashboardOutlined,
  ShopOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import {
  Authenticated,
  Refine
} from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { accessControlProvider } from "./accessControlProvider";
import { authProvider } from "./authProvider";
import { AppIcon } from "./components/app-icon";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import dataProvider from "./dataProvider";
import i18nProvider from "./i18nProvider";
import {
  AppCreate,
  AppEdit,
  AppList,
  AppShow,
} from "./pages/app";
import { Dashboard } from "./pages/dashboard";
import { Login } from "./pages/login";
import {
  PermissionCreate,
  PermissionEdit,
  PermissionList,
  PermissionShow,
} from "./pages/permission";
import {
  RoleCreate,
  RoleEdit,
  RoleList,
  RoleShow,
} from "./pages/roles";
import {
  ShopCreate,
  ShopEdit,
  ShopList,
  ShopShow,
} from "./pages/shop";
import {
  ShopDailyStatCreate,
  ShopDailyStatEdit,
  ShopDailyStatList,
  ShopDailyStatShow,
} from "./pages/shop-daily-stat";
import {
  UserCreate,
  UserEdit,
  UserList,
  UserShow,
} from "./pages/users";
import {
  CrudDefineModuelCreate,
  CrudDefineModuelEdit,
  CrudDefineModuelList,
  CrudDefineModuelShow,
} from "./pages/crudDefineModuel";
import {
  MasterDetailRelCreate,
  MasterDetailRelEdit,
  MasterDetailRelList,
  MasterDetailRelShow,
} from "./pages/masterDetailRel";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <Refine
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              i18nProvider={i18nProvider}
              routerProvider={routerBindings}
              resources={[
                {
                  name: "dashboard",
                  options: { label: "首页" },
                  list: Dashboard,
                  meta: {
                    canDelete: false,
                    canEdit: false,
                    canCreate: false,
                    icon: <DashboardOutlined /> // 你需要导入合适图标
                  },
                },
                {
                  name: "system",
                  list: () => null,
                  meta: {
                    label: "系统管理",
                    icon: <UserOutlined />, // 可自定义图标
                  },
                },
                {
                  name: "user",
                  list: UserList,
                  create: UserCreate,
                  edit: UserEdit,
                  show: UserShow,
                  meta: {
                    label: "用户管理",
                    canDelete: true,
                    parent: "system",
                  },
                },
                {
                  name: "role",
                  list: RoleList,
                  create: RoleCreate,
                  edit: RoleEdit,
                  show: RoleShow,
                  meta: {
                    label: "角色管理",
                    canDelete: true,
                    parent: "system",
                  },
                },
                {
                  name: "permission",
                  list: PermissionList,
                  create: PermissionCreate,
                  edit: PermissionEdit,
                  show: PermissionShow,
                  meta: {
                    label: "权限管理",
                    canDelete: true,
                    parent: "system",
                  },
                },
                // 一级菜单 - 基础设施
                {
                  name: "infra",
                  list: () => null,
                  meta: {
                    label: "基础设施",
                    icon: <ApiOutlined />,
                  },
                },
                // 一级菜单 - 业务系统
                {
                  name: "demo",
                  list: () => null,
                  meta: {
                    label: "演示",
                    icon: <BarChartOutlined  />,
                  },
                },                     
                {
                  name: "app",
                  list: AppList,
                  create: AppCreate,
                  edit: AppEdit,
                  show: AppShow,
                  meta: {
                    canDelete: true,
                    label: "应用管理",
                    icon: <ApiOutlined />,
                    parent: "demo",
                  },
                },
                {
                  name: "shop",
                  list: ShopList,
                  create: ShopCreate,
                  edit: ShopEdit,
                  show: ShopShow,
                  meta: {
                    canDelete: true,
                    label: "店铺管理",
                    icon: <ShopOutlined />,
                    parent: "demo",
                  },
                },
                {
                  name: "shop-daily-stat",
                  list: ShopDailyStatList,
                  create: ShopDailyStatCreate,
                  edit: ShopDailyStatEdit,
                  show: ShopDailyStatShow,
                  meta: {
                    canDelete: true,
                    label: "店铺日报管理",
                    icon: <BarChartOutlined />,
                    parent: "demo",
                  },
                },
                {
                  name: "crudDefineModuel",
                  list: CrudDefineModuelList,
                  create: CrudDefineModuelCreate,
                  edit: CrudDefineModuelEdit,
                  show: CrudDefineModuelShow,
                  meta: {
                    canDelete: true,
                    label: "单表配置",
                    icon: <ApiOutlined />,
                    parent: "infra",
                  },
                },
                {
                  name: "masterDetailRel",
                  list: MasterDetailRelList,
                  create: MasterDetailRelCreate,
                  edit: MasterDetailRelEdit,
                  show: MasterDetailRelShow,
                  meta: {
                    canDelete: true,
                    label: "主子表配置",
                    icon: <ApiOutlined />,
                    parent:"infra",
                  },
                },                                                    
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                useNewQueryKeys: true,
                projectId: "NGKlvZ-4e9SNh-YAkDWt",
                title: { text: "LingAdmin", icon: <AppIcon size={30} /> },
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-inner"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <ThemedLayoutV2
                        Header={Header}
                        Sider={(props) => <ThemedSiderV2 {...props} fixed />}
                      >
                        <Outlet />
                      </ThemedLayoutV2>
                    </Authenticated>
                  }
                >
                  <Route index element={<NavigateToResource resource="dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/user">
                    <Route index element={<UserList />} />
                    <Route path="create" element={<UserCreate />} />
                    <Route path="edit/:id" element={<UserEdit />} />
                    <Route path="show/:id" element={<UserShow />} />
                  </Route>
                  <Route path="/role">
                    <Route index element={<RoleList />} />
                    <Route path="create" element={<RoleCreate />} />
                    <Route path="edit/:id" element={<RoleEdit />} />
                    <Route path="show/:id" element={<RoleShow />} />
                  </Route>
                  <Route path="/permission">
                    <Route index element={<PermissionList />} />
                    <Route path="create" element={<PermissionCreate />} />
                    <Route path="edit/:id" element={<PermissionEdit />} />
                    <Route path="show/:id" element={<PermissionShow />} />
                  </Route>
                  <Route path="/app">
                    <Route index element={<AppList />} />
                    <Route path="create" element={<AppCreate />} />
                    <Route path="edit/:id" element={<AppEdit />} />
                    <Route path="show/:id" element={<AppShow />} />
                  </Route>
                  <Route path="/shop">
                    <Route index element={<ShopList />} />
                    <Route path="create" element={<ShopCreate />} />
                    <Route path="edit/:id" element={<ShopEdit />} />
                    <Route path="show/:id" element={<ShopShow />} />
                  </Route>
                  <Route path="/shop-daily-stat">
                    <Route index element={<ShopDailyStatList />} />
                    <Route path="create" element={<ShopDailyStatCreate />} />
                    <Route path="edit/:id" element={<ShopDailyStatEdit />} />
                    <Route path="show/:id" element={<ShopDailyStatShow />} />
                  </Route>
                  <Route path="/crudDefineModuel">
                    <Route index element={<CrudDefineModuelList />} />
                    <Route path="create" element={<CrudDefineModuelCreate />} />
                    <Route path="edit/:id" element={<CrudDefineModuelEdit />} />
                    <Route path="show/:id" element={<CrudDefineModuelShow />} />
                  </Route>                                                                                            
                  <Route path="/masterDetailRel">
                    <Route index element={<MasterDetailRelList />} />
                    <Route path="create" element={<MasterDetailRelCreate />} />
                    <Route path="edit/:id" element={<MasterDetailRelEdit />} />
                    <Route path="show/:id" element={<MasterDetailRelShow />} />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>
                <Route
                  element={
                    <Authenticated
                      key="authenticated-outer"
                      fallback={<Outlet />}
                    >
                      <NavigateToResource />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<Login />} />
                </Route>
              </Routes>

              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
