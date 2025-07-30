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

  // 按 parentCode 分组菜单
  const groupedMenus = rawMenus.reduce<Record<string | undefined, any[]>>(
    (acc, menu) => {
      const parentCode = getParentMenuCode(menu.parent_id, rawMenus);
      if (!acc[parentCode]) {
        acc[parentCode] = [];
      }
      acc[parentCode].push(menu);
      return acc;
    },
    {}
  );

  // 每组内按 order_by 升序排序
  for (const key in groupedMenus) {
    groupedMenus[key].sort((a, b) => (a.order_by ?? 0) - (b.order_by ?? 0));
  }

  // 递归展开菜单，按层级顺序+排序平铺
  const flattenMenus: any[] = [];

  function traverseMenus(parentCode: string | undefined) {
    const menus = groupedMenus[parentCode] || [];
    for (const menu of menus) {
      flattenMenus.push(menu);
      traverseMenus(menu.code); // 递归子菜单
    }
  }
  traverseMenus(undefined);

  // 构造资源数组
  const resources: IResourceItem[] = flattenMenus.map((menu) => {
    if(menu.code === "dashboard") {
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
    }else{
      const isDirectory = menu.type === 0;
      const moduleCode = menu.code;
      const moduleName = menu.name;
      const comp = pageMap[moduleCode] || {};

      return {
        name: moduleCode,
        list: isDirectory ? undefined : comp.list,
        create: isDirectory ? undefined : comp.create,
        edit: isDirectory ? undefined : comp.edit,
        show: isDirectory ? undefined : comp.show,
        meta: {
          label: moduleName,
          icon: menu.icon && iconMap[menu.icon],
          parent: getParentMenuCode(menu.parent_id, rawMenus),
          canDelete: !isDirectory,
          order: menu.order_by,
          hidden: menu.hidden,
        },
      };
    }
  });

  // 生成 routes
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

// 获取 parent 的 code
function getParentMenuCode(parentId: number, allMenus: any[]): string | undefined {
  const parent = allMenus.find((m) => m.id === parentId);
  return parent?.code || undefined;
}
