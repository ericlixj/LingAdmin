import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u52a0\u6cb9\u7ad9\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 32, "name": "station_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u90ae\u7f16", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 32, "name": "postcode", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u6cb9\u54c1", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "fuel_product", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u73b0\u91d1\u4ef7\u683c", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 10, "name": "cash_price", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u683c\u5f0f\u5316\u73b0\u91d1\u4ef7\u683c", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 32, "name": "cash_formatted_price", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u722c\u53d6\u65f6\u95f4", "form_type": "date", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "crawl_time", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "datetime", "unique": false, "updatable": false}];

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

export const GasPriceEdit = () => {
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
          name="station_id"
          label="加油站主键"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="postcode"
          label="邮编"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="fuel_product"
          label="油品"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="cash_price"
          label="现金价格"
          rules={[
            { max: 10, message: '最多输入 10 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="cash_formatted_price"
          label="格式化现金价格"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="crawl_time"
          label="爬取时间"
          rules={[
            
          ]}
        >

            <DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>

    </Edit>
  );
};