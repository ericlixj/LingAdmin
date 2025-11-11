import { TreeSelect } from "antd";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

interface DeptTreeSelectProps {
  value?: number | number[] | null;       // 单选是 number/null，多选是 number[]
  onChange?: (value: any) => void;         // 保持通用
  allowClear?: boolean;
  placeholder?: string;
  multiple?: boolean;                      // true = 多选
}

export const DeptTreeSelect: React.FC<DeptTreeSelectProps> = ({
  value,
  onChange,
  allowClear = true,
  placeholder = "请选择所属部门",
  multiple = false,
}) => {
  const { data: deptData, isLoading } = useList({
    resource: "dept",
    meta: { selectAll: true },
    filters: [{ field: "status", operator: "eq", value: 0 }],
  });

  const deptTreeData = useMemo(() => {
    const list = deptData?.data || [];
    const map = new Map<number, any>();
    const tree: any[] = [];

    list.forEach((item) => {
      map.set(item.id, {
        ...item,
        key: item.id,
        value: item.id,
        title: item.dept_name,
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
  }, [deptData?.data]);

  return (
    <TreeSelect
      style={{ width: "100%" }}
      treeData={deptTreeData}
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
