// hooks/useDynamicModules.ts
import React from "react";
import { IResourceItem } from "@refinedev/core";
import { Route } from "react-router-dom";
import { Dashboard } from "../pages/dashboard";
import {
  ApiOutlined,
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

// 动态导入所有 pages/**/index.ts
const modules = import.meta.glob("../pages/**/index.ts", { eager: true });

// 页面模块定义
type PageModule = Partial<{
  list: React.ComponentType<any>;
  create: React.ComponentType<any>;
  edit: React.ComponentType<any>;
  show: React.ComponentType<any>;
}>;

// 图标映射（可扩展）
const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: React.createElement(DashboardOutlined),
  UserOutlined: React.createElement(UserOutlined),
  ApiOutlined: React.createElement(ApiOutlined),
  BarChartOutlined: React.createElement(BarChartOutlined),
};

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function useDynamicModules(
  rawMenus: any[]
): {
  resources: IResourceItem[];
  routes: React.ReactNode[];
  pageMap: Record<string, PageModule>;
} {
  const pageMap: Record<string, PageModule> = {};

  // 构造 pageMap
  for (const path in modules) {
    const mod = modules[path] as any;
    const normalizedPath = path.replaceAll("\\", "/");
    const match = normalizedPath.match(/\.\.\/pages\/(.*?)\/index\.ts$/);
    if (match) {
      const moduleName = match[1];
      const pascal = capitalize(moduleName);
      pageMap[moduleName] = {
        list: mod[`${pascal}List`],
        create: mod[`${pascal}Create`],
        edit: mod[`${pascal}Edit`],
        show: mod[`${pascal}Show`],
      };
    }
  }

  // 按 parent_id 分组菜单
  const groupedMenus = rawMenus.reduce<Record<string | undefined, any[]>>(
    (acc, menu) => {
      const key = getParentPermissionCode(menu.parent_id, rawMenus);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(menu);
      return acc;
    },
    {}
  );

  // 每组内按 order_by 升序排序
  for (const key in groupedMenus) {
    groupedMenus[key].sort((a, b) => (a.order_by ?? 0) - (b.order_by ?? 0));
  }

  // 展平菜单
  const flattenMenus: any[] = [];

  function traverseMenus(parentCode: string | undefined) {
    const menus = groupedMenus[parentCode] || [];
    for (const menu of menus) {
      flattenMenus.push(menu);
      traverseMenus(menu.permission_code); // 递归子菜单
    }
  }
  traverseMenus(undefined);

  // 构造资源
  const resources: IResourceItem[] = flattenMenus.map((menu) => {
    if (menu.module_code === "dashboard") {
      return {
        name: "dashboard",
        list: Dashboard,
        meta: {
          label: "首页",
          icon: <DashboardOutlined />,
          order: menu.order_by,
          hidden: menu.hidden,
        },
      };
    } else {
      const isMenu = menu.type === 1;
      const moduleCode = menu.module_code;
      const menuLabel = menu.menu_label;
      const comp = pageMap[moduleCode] || {};

      return {
        name: moduleCode || menu.permission_code,
        list: isMenu ? comp.list : undefined,
        create: isMenu ? comp.create : undefined,
        edit: isMenu ? comp.edit : undefined,
        show: isMenu ? comp.show : undefined,
        meta: {
          label: menuLabel,
          icon: menu.icon && iconMap[menu.icon],
          parent: getParentPermissionCode(menu.parent_id, rawMenus),
          canDelete: true,
          order: menu.order_by,
          hidden: menu.hidden,
        },
      };
    }
  });

  // 路由生成
  const routes: React.ReactNode[] = Object.entries(pageMap).map(([name, comp]) => (
    <Route path={`/${name}`} key={name}>
      {comp.list && <Route index element={React.createElement(comp.list)} />}
      {comp.create && <Route path="create" element={React.createElement(comp.create)} />}
      {comp.edit && <Route path="edit/:id" element={React.createElement(comp.edit)} />}
      {comp.show && <Route path="show/:id" element={React.createElement(comp.show)} />}
    </Route>
  ));

  return { resources, routes, pageMap };
}

// 获取父菜单的 permission_code
function getParentPermissionCode(parentId: number, allMenus: any[]): string | undefined {
  const parent = allMenus.find((m) => m.id === parentId);
  return parent?.permission_code || undefined;
}
