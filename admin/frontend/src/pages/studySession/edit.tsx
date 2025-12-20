import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "pk", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "user_id", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "user_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "exam_id", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "exam_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5b66\u4e60\u6a21\u5f0f", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": 32, "name": "mode", "nullable": false, "options": [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "start_time", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "start_time", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "end_time", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "end_time", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "score", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "score", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}];

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

export const StudySessionEdit = () => {
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
          name="user_id"
          label="user_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="exam_id"
          label="exam_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="mode"
          label="学习模式"
          rules={[
            { required: true, message: '请输入学习模式' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
            <Select>
                <Select.Option value="exam">考试</Select.Option>
                <Select.Option value="practice">练习</Select.Option>
                <Select.Option value="review">复习</Select.Option>
                <Select.Option value="flashcard">FlashCard</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="start_time"
          label="start_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="end_time"
          label="end_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="score"
          label="score"
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