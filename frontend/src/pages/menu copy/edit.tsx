import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber, TreeSelect } from "antd";
import { useList } from "@refinedev/core";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7236ID", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": null, "name": "parent_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": true, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u83dc\u5355\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 50, "name": "name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7f16\u7801", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 100, "name": "code", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u56fe\u6807", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 50, "name": "icon", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u7c7b\u578b", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "type", "nullable": false, "options": [{"label": "\u76ee\u5f55", "value": 0}, {"label": "\u83dc\u5355", "value": 1}, {"label": "\u6309\u94ae", "value": 2}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u6392\u5e8f\u53f7", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "order_by", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u72b6\u6001", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "status", "nullable": false, "options": [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u6a21\u5757\u540d\u79f0\uff08\u5f62\u5982\uff1asysDicData\uff09", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 50, "name": "modual_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}];

function prepareInitialValues(record: Record<string, any>, fields: any[]) {
  const result: Record<string, any> = {};
  fields.forEach((field) => {
    const value = record[field.name];
    if (field.form_type === "date") {
      result[field.name] = value ? dayjs(value) : null;
    } else if (field.form_type === "checkbox" && field.options) {
      result[field.name] = value ? value.split(",").map((v: string) => v.trim()) : [];
    } else if (field.form_type === "select") {
      result[field.name] = String(value);
    } else {
      result[field.name] = value;
    }
  });
  return result;
}

export const MenuEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);

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

  const record = queryResult?.data?.data;
  const form = formProps?.form;
  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      form.setFieldsValue(prepareInitialValues(record, fields));
      setInitialized(true);
    }
  }, [initialized, queryResult?.data?.data]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  // 这里判断是否加载完成，避免组件内部访问未定义数据

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }
  return (
    <Edit saveButtonProps={saveButtonProps}>
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
            { required: true, message: '请输入菜单名称' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="code"
          label="编码"
          rules={[
            { required: true, message: '请输入编码' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="icon"
          label="图标"
          rules={[
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="type"
          label="类型"
          rules={[
            { required: true, message: '请输入类型' }
          ]}
        >
            <Select>
                <Select.Option value="0">目录</Select.Option>
                <Select.Option value="1">菜单</Select.Option>
                <Select.Option value="2">按钮</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="order_by"
          label="排序号"
          rules={[
            { required: true, message: '请输入排序号' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' }
          ]}
        >
            <Select>
                <Select.Option value="0">开启</Select.Option>
                <Select.Option value="1">关闭</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="modual_name"
          label="模块名称（形如：sysDicData）"
          rules={[
            { required: true, message: '请输入模块名称（形如：sysDicData）' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
      </Form>

    </Edit>
  );
};

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