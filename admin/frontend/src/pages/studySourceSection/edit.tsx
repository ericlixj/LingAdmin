import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "pk", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5173\u8054source\u7684id", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "source_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5bf9\u5e94\u7ae0\u8282", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "chapter", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u6bb5\u843d", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "section", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "page_start", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "page_start", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "page_end", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "page_end", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u539f\u6587\u6458\u8981", "form_type": "textarea", "index": false, "insertable": true, "listable": false, "max_length": 1024, "name": "anchor_text", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const StudySourceSectionEdit = () => {
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
          name="source_id"
          label="关联source的id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="chapter"
          label="对应章节"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="section"
          label="段落"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="page_start"
          label="page_start"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="page_end"
          label="page_end"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="anchor_text"
          label="原文摘要"
          rules={[
            { max: 1024, message: '最多输入 1024 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>

    </Edit>
  );
};