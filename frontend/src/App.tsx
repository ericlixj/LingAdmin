import {
  ApiOutlined,
  BarChartOutlined,
  DashboardOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { Authenticated, Refine } from "@refinedev/core";
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
import i18nProvider from "./i18n/i18nProvider";
import { useTranslate } from "@refinedev/core";
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
import {
  DemoUserCreate,
  DemoUserEdit,
  DemoUserList,
  DemoUserShow,
} from "./pages/demoUser";
import {
  SysDicCreate,
  SysDicEdit,
  SysDicList,
  SysDicShow,
} from "./pages/sysDic";

const t = i18nProvider.translate;

function App() {
  // const t = useTranslate();
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
                  options: { label: t("dashboard.titles.list") },
                  list: Dashboard,
                  meta: {
                    canDelete: false,
                    canEdit: false,
                    canCreate: false,
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: "system",
                  list: () => null,
                  meta: {
                    label: t("system.titles.list"),
                    icon: <UserOutlined />,
                  },
                },
                {
                  name: "user",
                  list: UserList,
                  create: UserCreate,
                  edit: UserEdit,
                  show: UserShow,
                  meta: {
                    label: t("user.titles.list"),
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
                    label: t("role.titles.list"),
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
                    label: t("permission.titles.list"),
                    canDelete: true,
                    parent: "system",
                  },
                },
                {
                  name: "infra",
                  list: () => null,
                  meta: {
                    label: t("infra.titles.list") || "Infrastructure", // 如果没有定义，可以填默认英文
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "demo",
                  list: () => null,
                  meta: {
                    label: t("demo.titles.list") || "Demo",
                    icon: <BarChartOutlined />,
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
                    label: t("crudDefineModuel.titles.list"),
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
                    label: t("masterDetailRel.titles.list"),
                    icon: <ApiOutlined />,
                    parent: "infra",
                  },
                },
                {
                  name: "demoUser",
                  list: DemoUserList,
                  create: DemoUserCreate,
                  edit: DemoUserEdit,
                  show: DemoUserShow,
                  meta: {
                    canDelete: true,
                    label: t("demoUser.titles.list"),
                    icon: <ApiOutlined />,
                    parent: "demo",
                  },
                },
                {
                  name: "sysDic",
                  list: SysDicList,
                  create: SysDicCreate,
                  edit: SysDicEdit,
                  show: SysDicShow,
                  meta: {
                    canDelete: true,
                    label: t("sysDic.titles.list"),
                    parent: "system",
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
                  <Route path="/demoUser">
                    <Route index element={<DemoUserList />} />
                    <Route path="create" element={<DemoUserCreate />} />
                    <Route path="edit/:id" element={<DemoUserEdit />} />
                    <Route path="show/:id" element={<DemoUserShow />} />
                  </Route>
                  <Route path="/sysDic">
                    <Route index element={<SysDicList />} />
                    <Route path="create" element={<SysDicCreate />} />
                    <Route path="edit/:id" element={<SysDicEdit />} />
                    <Route path="show/:id" element={<SysDicShow />} />
                  </Route>

                  <Route path="*" element={<ErrorComponent />} />
                </Route>
                <Route
                  element={
                    <Authenticated key="authenticated-outer" fallback={<Outlet />}>
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
