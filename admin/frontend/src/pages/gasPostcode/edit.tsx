import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u90ae\u7f16", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 32, "name": "postcode", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u663e\u793a\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "display_name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7ef4\u5ea6", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "latitude", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7ecf\u5ea6", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "longitude", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u533a\u57df\u7f16\u7801", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "region_code", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const GasPostcodeEdit = () => {
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
          name="postcode"
          label="邮编"
          rules={[
            { required: true, message: '请输入邮编' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="display_name"
          label="显示名称"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="latitude"
          label="维度"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="longitude"
          label="经度"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="region_code"
          label="区域编码"
          rules={[
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
      </Form>

    </Edit>
  );
};