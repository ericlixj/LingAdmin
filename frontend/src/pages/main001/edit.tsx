import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5b57\u6bb5\u7f16\u7801", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 50, "name": "dic_code", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u5b57\u5178\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": false, "max_length": 100, "name": "dic_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u72b6\u6001", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "status", "nullable": false, "options": [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5907\u6ce8", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 255, "name": "remark", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const Main001Edit = () => {
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
          name="dic_code"
          label="字段编码"
          rules={[
            { required: true, message: '请输入字段编码' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="dic_name"
          label="字典名称"
          rules={[
            { required: true, message: '请输入字典名称' },
            { max: 100, message: '最多输入 100 个字符' }
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
          name="remark"
          label="备注"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>

    </Edit>
  );
};