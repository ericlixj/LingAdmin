import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, InputNumber, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import { useList } from "@refinedev/core";

export const MenuCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 加载菜单数据用于 parent_id 下拉
  const { data: menuData } = useList({
    resource: "menu", // 确保这个 resource 是你的菜单接口
    sorters: [
      {
        field: "id",
        order: "asc",
      },
    ],      
    pagination: {
      current: 1,
      pageSize: 1001,
    },
  });
  const treeData = buildTree(menuData?.data || [], 0);

  useEffect(() => {
    const defaults = {
      type: "0",
      order_by: 0,
      status: "0",
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="parent_id"
          label="父菜单"
          rules={[{ required: true, message: "请选择父菜单" }]}
        >
          <TreeSelect
            allowClear
            placeholder="请选择父菜单"
            style={{ width: "100%" }}
            treeDefaultExpandAll
            treeData={treeData}
            fieldNames={{ label: "name", value: "id", children: "children" }}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="菜单名称"
          rules={[
            { required: true, message: "请输入菜单名称" },
            { max: 50, message: "最多输入 50 个字符" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="code"
          label="编码"
          rules={[
            { required: true, message: "请输入编码" },
            { max: 100, message: "最多输入 100 个字符" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="icon"
          label="图标"
          rules={[{ max: 50, message: "最多输入 50 个字符" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="type"
          label="类型"
          rules={[{ required: true, message: "请选择类型" }]}
        >
          <Select
            options={[
              { label: "目录", value: "0" },
              { label: "菜单", value: "1" },
              { label: "按钮", value: "2" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="order_by"
          label="排序号"
          rules={[
            { required: true, message: "请输入排序号" },
            { type: "number", message: "必须是数字" },
          ]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: "请选择状态" }]}
        >
          <Select
            options={[
              { label: "开启", value: "0" },
              { label: "关闭", value: "1" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="modual_name"
          label="模块名称（形如：sysDicData）"
          rules={[
            { required: true, message: "请输入模块名称" },
            { max: 50, message: "最多输入 50 个字符" },
          ]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};

// 构建树结构工具函数
function buildTree(data: any[], parentId: number | null = null) {
  return data
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      key: item.id,
      value: item.id,
      title: item.name,
      children: buildTree(data, item.id),
    }));
}
