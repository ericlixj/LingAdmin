import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5546\u5bb6id", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "merchant_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u4f20\u5355\u540d\u79f0", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "name", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5f00\u59cb\u6709\u6548\u671f", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "valid_from", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7ed3\u675f\u6709\u6548\u671f", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "valid_to", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5206\u7c7bJSON", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "categories", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u4f20\u5355ID", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "fly_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}];

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

export const FlyerMainEdit = () => {
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
          name="merchant_id"
          label="商家id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="name"
          label="传单名称"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="valid_from"
          label="开始有效期"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="valid_to"
          label="结束有效期"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="categories"
          label="分类JSON"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="fly_id"
          label="传单ID"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>

    </Edit>
  );
};