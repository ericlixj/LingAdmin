import { TreeSelect } from "antd";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

interface MenuTreeSelectProps {
  value?: number | number[] | null;       // 单选是 number/null，多选是 number[]
  onChange?: (value: any) => void;        // 保持通用
  allowClear?: boolean;
  placeholder?: string;
  multiple?: boolean;                      // true = 多选
}

export const MenuTreeSelect: React.FC<MenuTreeSelectProps> = ({
  value,
  onChange,
  allowClear = true,
  placeholder = "请选择菜单",
  multiple = false,
}) => {
  const { data: menuData, isLoading } = useList({
    resource: "menu/list_valid_menus",
    meta: { selectAll: true },
    pagination: {
      pageSize: 9999,
    },
    sorters: [
      {
        field: "id",
        order: "asc",
      },
    ],    
  });

  const menuTreeData = useMemo(() => {
    const list = menuData?.data || [];
    const map = new Map<number, any>();
    const tree: any[] = [];

    list.forEach((item) => {
      map.set(item.id, {
        ...item,
        key: item.id,
        value: item.id,
        title: item.menu_label,
        children: [],
      });
    });

    list.forEach((item) => {
      const node = map.get(item.id);
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        tree.push(node);
      }
    });

    return tree;
  }, [menuData?.data]);

  return (
    <TreeSelect
      style={{ width: "100%" }}
      treeData={menuTreeData}
      placeholder={placeholder}
      loading={isLoading}
      treeDefaultExpandAll
      allowClear={allowClear}
      treeLine
      showSearch
      value={value}
      onChange={onChange}
      treeCheckable={multiple}       // 多选模式
      multiple={multiple}            // 兼容 antd v5 的多选属性
    />
  );
};
