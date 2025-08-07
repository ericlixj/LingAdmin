import { Create, useForm } from "@refinedev/antd";
import { Form, Input, TreeSelect } from "antd";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 加载部门列表，过滤掉禁用的
  const { data: deptData, isLoading } = useList({
    resource: "dept",
    meta: { selectAll: true },
    filters: [{ field: "status", operator: "eq", value: 0 }],
  });

  // 构建 TreeSelect 数据
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
    <Create saveButtonProps={saveButtonProps}>
      <Form 
        {...formProps} 
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="full_name" label="Full Name">
          <Input />
        </Form.Item>
        <Form.Item 
          name="dept_id" 
          label="所属部门"
          rules={[{ required: true, message: "请选择所属部门" }]}
        >
          <TreeSelect
            style={{ width: "100%" }}
            treeData={deptTreeData}
            placeholder="请选择所属部门"
            loading={isLoading}
            treeDefaultExpandAll
            allowClear
            treeLine
            showSearch
          />
        </Form.Item>
      </Form>
    </Create>
  );
};
