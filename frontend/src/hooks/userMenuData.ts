import { useList } from "@refinedev/core";

export const useMenuData = () => {
  return useList({
    resource: "menu/list_valid_menus",
    pagination: {
      pageSize: 9999,
    },
    sorters: [
      {
        field: "id",
        order: "asc",
      },
    ],
    queryOptions: {
      staleTime: 1000 * 60 * 10, // 10 分钟不重新请求
      cacheTime: 1000 * 60 * 30,
    },
  });
};