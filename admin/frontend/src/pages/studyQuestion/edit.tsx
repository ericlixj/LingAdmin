import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "pk", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "exam_id", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "exam_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "type", "form_type": "select", "index": false, "insertable": false, "listable": false, "max_length": 32, "name": "type", "nullable": false, "options": [{"label": "\u5355\u9009\u7c7b\u578b", "value": "single"}, {"label": "\u591a\u9009\u7c7b\u578b", "value": "multi"}, {"label": "\u5224\u65ad\u7c7b\u578b", "value": "judge"}], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u9898\u5e72", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 9999, "name": "stem", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u9009\u9879JSON", "form_type": "textarea", "index": false, "insertable": true, "listable": false, "max_length": 9999, "name": "options", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7b54\u6848JSON", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 9999, "name": "answer", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5b98\u65b9\u89e3\u91ca", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 9999, "name": "explanation_raw", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u4eba\u8bdd\u89e3\u91ca", "form_type": "textarea", "index": false, "insertable": true, "listable": false, "max_length": 9999, "name": "explanation_human", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u72b6\u6001", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": 2, "name": "status", "nullable": false, "options": [{"label": "\u5f00\u542f", "value": 1}, {"label": "\u5173\u95ed", "value": 0}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "int", "unique": false, "updatable": true}];

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

export const StudyQuestionEdit = () => {
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
          name="exam_id"
          label="exam_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="type"
          label="type"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
            <Select>
                <Select.Option value="single">单选类型</Select.Option>
                <Select.Option value="multi">多选类型</Select.Option>
                <Select.Option value="judge">判断类型</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="stem"
          label="题干"
          rules={[
            { required: true, message: '请输入题干' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="options"
          label="选项JSON"
          rules={[
            { required: true, message: '请输入选项JSON' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="answer"
          label="答案JSON"
          rules={[
            { required: true, message: '请输入答案JSON' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="explanation_raw"
          label="官方解释"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="explanation_human"
          label="人话解释"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>

    </Edit>
  );
};