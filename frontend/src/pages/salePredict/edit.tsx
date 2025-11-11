import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "2025", "description": "\u7edf\u8ba1\u5e74", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 10, "name": "stat_year", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "1", "description": "\u7edf\u8ba1\u6708", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 10, "name": "stat_month", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u5b9e\u9645\u9500\u91cf", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 10, "name": "sales_quantity", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "sku", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 20, "name": "sku", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u9884\u6d4b\u9500\u91cf", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 10, "name": "predict_quantity", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": true, "type": "int", "unique": false, "updatable": true}];

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

export const SalePredictEdit = () => {
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
          name="stat_year"
          label="统计年"
          rules={[
            { required: true, message: '请输入统计年' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="stat_month"
          label="统计月"
          rules={[
            { required: true, message: '请输入统计月' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="sku"
          label="sku"
          rules={[
            { required: true, message: '请输入sku' },
            { max: 20, message: '最多输入 20 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="sales_quantity"
          label="实际销量"
          rules={[
            { required: true, message: '请输入实际销量' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="predict_quantity"
          label="预测销量"
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