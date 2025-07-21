
import {
  ApiOutlined,
  BarChartOutlined,
  DashboardOutlined,
  KeyOutlined,
  ShopOutlined,
  TeamOutlined,
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
  AppNewCreate,
  AppNewEdit,
  AppNewList,
  AppNewShow,
} from "./pages/appNew";
import {
  AppNew2Create,
  AppNew2Edit,
  AppNew2List,
  AppNew2Show,
} from "./pages/appNew2";
import {
  AppNew3Create,
  AppNew3Edit,
  AppNew3List,
  AppNew3Show,
} from "./pages/appNew3";
import {
  AppNew4Create,
  AppNew4Edit,
  AppNew4List,
  AppNew4Show,
} from "./pages/appNew4";
import {
  AppNew5Create,
  AppNew5Edit,
  AppNew5List,
  AppNew5Show,
} from "./pages/appNew5";
import {
  CurdModel001Create,
  CurdModel001Edit,
  CurdModel001List,
  CurdModel001Show,
} from "./pages/curdModel001";
import {
  CurdModel02Create,
  CurdModel02Edit,
  CurdModel02List,
  CurdModel02Show,
} from "./pages/curdModel02";
import {
  MulCurdModelUserCreate,
  MulCurdModelUserEdit,
  MulCurdModelUserList,
  MulCurdModelUserShow,
} from "./pages/mulCurdModelUser";
import {
  MulCurdModelUser01Create,
  MulCurdModelUser01Edit,
  MulCurdModelUser01List,
  MulCurdModelUser01Show,
} from "./pages/mulCurdModelUser01";
import {
  MulCurdModelUser02Create,
  MulCurdModelUser02Edit,
  MulCurdModelUser02List,
  MulCurdModelUser02Show,
} from "./pages/mulCurdModelUser02";

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
                  name: "user",
                  list: UserList,
                  create: UserCreate,
                  edit: UserEdit,
                  show: UserShow,
                  meta: {
                    canDelete: true,
                    label: "用户管理",
                    icon: <UserOutlined />,
                  },
                },
                {
                  name: "role",
                  list: RoleList,
                  create: RoleCreate,
                  edit: RoleEdit,
                  show: RoleShow,
                  meta: {
                    canDelete: true,
                    label: "角色管理",
                    icon: <TeamOutlined />,
                  },
                },
                {
                  name: "permission",
                  list: PermissionList,
                  create: PermissionCreate,
                  edit: PermissionEdit,
                  show: PermissionShow,
                  meta: {
                    canDelete: true,
                    label: "权限管理",
                    icon: <KeyOutlined />,
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
                  },
                },
                {
                  name: "appNew",
                  list: AppNewList,
                  create: AppNewCreate,
                  edit: AppNewEdit,
                  show: AppNewShow,
                  meta: {
                    canDelete: true,
                    label: "应用管理New",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "appNew2",
                  list: AppNew2List,
                  create: AppNew2Create,
                  edit: AppNew2Edit,
                  show: AppNew2Show,
                  meta: {
                    canDelete: true,
                    label: "应用管理New2",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "appNew3",
                  list: AppNew3List,
                  create: AppNew3Create,
                  edit: AppNew3Edit,
                  show: AppNew3Show,
                  meta: {
                    canDelete: true,
                    label: "应用管理New3",
                    icon: <ApiOutlined />,
                  },
                },                               
                {
                  name: "appNew4",
                  list: AppNew4List,
                  create: AppNew4Create,
                  edit: AppNew4Edit,
                  show: AppNew4Show,
                  meta: {
                    canDelete: true,
                    label: "应用管理New4",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "appNew5",
                  list: AppNew5List,
                  create: AppNew5Create,
                  edit: AppNew5Edit,
                  show: AppNew5Show,
                  meta: {
                    canDelete: true,
                    label: "应用管理New5",
                    icon: <ApiOutlined />,
                  },
                },  
                {
                  name: "curdModel001",
                  list: CurdModel001List,
                  create: CurdModel001Create,
                  edit: CurdModel001Edit,
                  show: CurdModel001Show,
                  meta: {
                    canDelete: true,
                    label: "单表模型01管理",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "curdModel02",
                  list: CurdModel02List,
                  create: CurdModel02Create,
                  edit: CurdModel02Edit,
                  show: CurdModel02Show,
                  meta: {
                    canDelete: true,
                    label: "单表模型02管理",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "mulCurdModelUser",
                  list: MulCurdModelUserList,
                  create: MulCurdModelUserCreate,
                  edit: MulCurdModelUserEdit,
                  show: MulCurdModelUserShow,
                  meta: {
                    canDelete: true,
                    label: "主子表模型用户管理",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "mulCurdModelUser01",
                  list: MulCurdModelUser01List,
                  create: MulCurdModelUser01Create,
                  edit: MulCurdModelUser01Edit,
                  show: MulCurdModelUser01Show,
                  meta: {
                    canDelete: true,
                    label: "主子表模型用户管理01",
                    icon: <ApiOutlined />,
                  },
                },         
                {
                  name: "mulCurdModelUser02",
                  list: MulCurdModelUser02List,
                  create: MulCurdModelUser02Create,
                  edit: MulCurdModelUser02Edit,
                  show: MulCurdModelUser02Show,
                  meta: {
                    canDelete: true,
                    label: "主子表模型02用户管理",
                    icon: <ApiOutlined />,
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
                  <Route path="/appNew">
                    <Route index element={<AppNewList />} />
                    <Route path="create" element={<AppNewCreate />} />
                    <Route path="edit/:id" element={<AppNewEdit />} />
                    <Route path="show/:id" element={<AppNewShow />} />
                  </Route>                          
                  <Route path="/appNew2">
                    <Route index element={<AppNew2List />} />
                    <Route path="create" element={<AppNew2Create />} />
                    <Route path="edit/:id" element={<AppNew2Edit />} />
                    <Route path="show/:id" element={<AppNew2Show />} />
                  </Route>
                  <Route path="/appNew3">
                    <Route index element={<AppNew3List />} />
                    <Route path="create" element={<AppNew3Create />} />
                    <Route path="edit/:id" element={<AppNew3Edit />} />
                    <Route path="show/:id" element={<AppNew3Show />} />
                  </Route>
                  <Route path="/appNew4">
                    <Route index element={<AppNew4List />} />
                    <Route path="create" element={<AppNew4Create />} />
                    <Route path="edit/:id" element={<AppNew4Edit />} />
                    <Route path="show/:id" element={<AppNew4Show />} />
                  </Route>                  
                  <Route path="/appNew5">
                    <Route index element={<AppNew5List />} />
                    <Route path="create" element={<AppNew5Create />} />
                    <Route path="edit/:id" element={<AppNew5Edit />} />
                    <Route path="show/:id" element={<AppNew5Show />} />
                  </Route>        
                  <Route path="/curdModel001">
                    <Route index element={<CurdModel001List />} />
                    <Route path="create" element={<CurdModel001Create />} />
                    <Route path="edit/:id" element={<CurdModel001Edit />} />
                    <Route path="show/:id" element={<CurdModel001Show />} />
                  </Route>
                  <Route path="/curdModel02">
                    <Route index element={<CurdModel02List />} />
                    <Route path="create" element={<CurdModel02Create />} />
                    <Route path="edit/:id" element={<CurdModel02Edit />} />
                    <Route path="show/:id" element={<CurdModel02Show />} />
                  </Route>
                  <Route path="/mulCurdModelUser">
                    <Route index element={<MulCurdModelUserList />} />
                    <Route path="create" element={<MulCurdModelUserCreate />} />
                    <Route path="edit/:id" element={<MulCurdModelUserEdit />} />
                    <Route path="show/:id" element={<MulCurdModelUserShow />} />
                  </Route>            
                  <Route path="/mulCurdModelUser01">
                    <Route index element={<MulCurdModelUser01List />} />
                    <Route path="create" element={<MulCurdModelUser01Create />} />
                    <Route path="edit/:id" element={<MulCurdModelUser01Edit />} />
                    <Route path="show/:id" element={<MulCurdModelUser01Show />} />
                  </Route>       
                  <Route path="/mulCurdModelUser02">
                    <Route index element={<MulCurdModelUser02List />} />
                    <Route path="create" element={<MulCurdModelUser02Create />} />
                    <Route path="edit/:id" element={<MulCurdModelUser02Edit />} />
                    <Route path="show/:id" element={<MulCurdModelUser02Show />} />
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
