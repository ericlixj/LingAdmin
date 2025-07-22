import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u8ba2\u5355\u7f16\u7801", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 50, "name": "order_code", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u5f00\u542f\u65e5\u671f", "form_type": "date", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "open_date", "nullable": true, "options": [], "primary_key": false, "query_type": "in", "queryable": true, "required": false, "sortable": true, "type": "datetime", "unique": false, "updatable": true}, {"common": false, "default": "enabled", "description": "\u8ba2\u5355\u72b6\u6001", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": 128, "name": "order_status", "nullable": false, "options": [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "None", "description": "\u5f00\u542f\u529f\u80fd", "form_type": "checkbox", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "open_function", "nullable": true, "options": [{"label": "\u529f\u80fdA", "value": 1}, {"label": "\u529f\u80fdB", "value": 2}, {"label": "\u529f\u80fdC", "value": 3}], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u8ba2\u5355\u4fe1\u606f", "form_type": "textarea", "index": false, "insertable": true, "listable": false, "max_length": 1000, "name": "order_info", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

function prepareInitialValues(record: Record<string, any>, fields: any[]) {
  const result: Record<string, any> = {};
  fields.forEach((field) => {
    const value = record[field.name];
    if (field.form_type === "date") {
      result[field.name] = value ? dayjs(value) : null;
    } else if (field.form_type === "checkbox" && field.options) {
      result[field.name] = value ? value.split(",").map((v: string) => Number(v.trim())) : [];
    } else {
      result[field.name] = value;
    }
  });
  return result;
}

export const DemoOrderEdit = () => {
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
      open_function: (values.open_function || []).join(","),    };
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
          name="order_code"
          label="订单编码"
          rules={[
{ required: true, message: '请输入订单编码' },            { max: 50, message: '最多输入 50 个字符' },
          ]}
        >
            <Input />
        </Form.Item>
        <Form.Item
          name="open_date"
          label="开启日期"
          rules={[
          ]}
        >

            <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="order_status"
          label="订单状态"
          rules={[
{ required: true, message: '请输入订单状态' },            { max: 128, message: '最多输入 128 个字符' },
          ]}
        >
            <Select>
                <Select.Option value="enabled">启用</Select.Option>
                <Select.Option value="disabled">停用</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="open_function"
          label="开启功能"
          rules={[
          ]}
        >
            <Checkbox.Group
              options={[
                  { label: "功能A", value: 1 },                   { label: "功能B", value: 2 },                   { label: "功能C", value: 3 }              ]}
            />
        </Form.Item>
        <Form.Item
          name="order_info"
          label="订单信息"
          rules={[
            { max: 1000, message: '最多输入 1000 个字符' },
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>

    </Edit>
  );
};