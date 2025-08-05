import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5916\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "sys_dic_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5b57\u5178\u6807\u7b7e", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 50, "name": "label", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5b57\u5178\u952e\u503c", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 50, "name": "value", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u72b6\u6001", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "status", "nullable": false, "options": [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u5c55\u793a\u6392\u5e8f\u53f7\u3010\u6b63\u5e8f\u3011", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "orderby", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5907\u6ce8", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 200, "name": "remark", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const SysDicData001Edit = () => {
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

  // 这里判断是否加载完成，避免组件内部访问未定义数据

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }
  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="sys_dic_id"
          label="外键"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="label"
          label="字典标签"
          rules={[
            { required: true, message: '请输入字典标签' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="value"
          label="字典键值"
          rules={[
            { required: true, message: '请输入字典键值' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
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
          name="orderby"
          label="展示排序号【正序】"
          rules={[
            { required: true, message: '请输入展示排序号【正序】' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[
            { max: 200, message: '最多输入 200 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>

    </Edit>
  );
};