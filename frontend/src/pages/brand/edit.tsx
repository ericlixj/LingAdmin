import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u82f1\u6587\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "en_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7b80\u4f53\u4e2d\u6587\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "cn_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7e41\u4f53\u4e2d\u6587\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "hk_name", "nullable": true, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u539f\u59cb\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "original_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": true, "type": "str", "unique": false, "updatable": true}];

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

export const BrandEdit = () => {
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
          name="en_name"
          label="英文名称"
          rules={[
            { required: true, message: '请输入英文名称' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="cn_name"
          label="简体中文名称"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="hk_name"
          label="繁体中文名称"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="original_name"
          label="原始名称"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
      </Form>

    </Edit>
  );
};