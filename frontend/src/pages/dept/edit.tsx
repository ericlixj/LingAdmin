import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber, TreeSelect } from "antd";
import { useList  } from "@refinedev/core";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7236ID", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "parent_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u90e8\u95e8\u7f16\u7801", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "dept_code", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u90e8\u95e8\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "dept_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u6392\u5e8f\u53f7", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "orderby", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u8d1f\u8d23\u4ebaID", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "leader_user_id", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u72b6\u6001", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "status", "nullable": false, "options": [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "int", "unique": false, "updatable": true}];

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

export const DeptEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);

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

  // 这里判断是否加载完成，避免组件内部访问未定义数据

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }
  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="parent_id"
          label="父ID"
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
            <Select>
                <Select.Option value="0">开启</Select.Option>
                <Select.Option value="1">关闭</Select.Option>
            </Select>
        </Form.Item>
      </Form>

    </Edit>
  );
};