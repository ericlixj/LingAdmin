import { Edit, useForm } from "@refinedev/antd";
import { useParsed, useList } from "@refinedev/core";
import { Form, Input, Switch, TreeSelect } from "antd";
import { useMemo } from "react";

export const UserEdit = () => {
  const { formProps, saveButtonProps } = useForm();
  const { id } = useParsed(); 
  const recordId = Number(id);
  const canDelete = recordId !== 1;

  // 获取部门数据
  const { data: deptData } = useList({
    resource: "dept",
    meta: { selectAll: true },
    filters: [{ field: "status", operator: "eq", value: 0 }],
  });

  // 转为 Tree 结构
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
    <Edit saveButtonProps={saveButtonProps} canDelete={canDelete}>
      <Form
        {...formProps}
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="email" label="Email" rules={[{ required: true }]} >
          <Input disabled />
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
            treeData={deptTreeData}
            treeDefaultExpandAll
            placeholder="请选择部门"
            
            allowClear
          />
        </Form.Item>

        <Form.Item name="is_active" label="Is Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
