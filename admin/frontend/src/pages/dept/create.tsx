import { Create, useForm, useSelect } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Select, TreeSelect, DatePicker, InputNumber } from "antd";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const DeptCreate = () => {
  const { formProps, saveButtonProps } = useForm();
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get("parent_id");

  useEffect(() => {
    const defaults = {
      parent_id: parentId,
      orderby:"0",
      status:"0",
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  const { selectProps: leaderUserSelectProps } = useSelect({
    resource: "user/list_all_active_users", 
    optionLabel: "full_name",
    optionValue: "id",
    sorters: [
      {
        field: "id",
        order: "asc",
      },
    ],
  });

  const { data, isLoading } = useList({
    resource: "dept",  // 你的部门接口资源名
    pagination: { pageSize: 1000 },
    sorters: [{ field: "id", order: "asc" }],
    filters: [
      {
        field: "status",
        operator: "eq",
        value: 0, // 只选择状态为开启的部门
      },
    ],
  });

  function buildTreeSelectTree(items: any[], parentId: number | null = null) {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        title: item.dept_name,
        value: item.id,
        key: item.id,
        children: buildTreeSelectTree(items, item.id),
      }));
  } 
  const treeData = useMemo(() => {
    if (!data) return [];
    return buildTreeSelectTree(data.data,-1);
  }, [data]);  

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="parent_id"
          label="上级部门"
        >
            <TreeSelect
              treeData={treeData}
              placeholder="请选择上级部门"
              allowClear
              treeDefaultExpandAll
              showSearch
              treeNodeFilterProp="title"
              dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
              // showCheckedStrategy={SHOW_PARENT} // 只在多选时用
            />
        </Form.Item>
        <Form.Item
          name="dept_code"
          label="部门编码"
          rules={[
            { required: true, message: '请输入部门编码' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="dept_name"
          label="部门名称"
          rules={[
            { required: true, message: '请输入部门名称' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="orderby"
          label="排序号"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="leader_user_id"
          label="负责人"
        >
          <Select {...leaderUserSelectProps} allowClear />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' }
          ]}
        >
          <Select
            options={[
                { label: "开启", value: "0" },                { label: "关闭", value: "1" }            ]}
          />

        </Form.Item>
      </Form>
    </Create>
  );
};