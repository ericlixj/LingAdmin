import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "ItemID", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "item_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u540d\u79f0", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": 250, "name": "name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u54c1\u724c", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": 100, "name": "brand", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5f00\u59cb\u6709\u6548\u671f", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "valid_from", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7ed3\u675f\u6709\u6548\u671f", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "valid_to", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u622a\u81f3\u6709\u6548\u671f", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "available_to", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u56fe\u7247\u5730\u5740", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 100, "name": "cutout_image_url", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u4ef7\u683c", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 10, "name": "price", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u4f20\u5355ID", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 10, "name": "flyer_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5546\u5bb6ID", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "merchant_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5546\u5bb6\u540d", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": 100, "name": "merchant", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}];

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

export const FlyerDetailsEdit = () => {
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
          name="item_id"
          label="ItemID"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { max: 250, message: '最多输入 250 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="brand"
          label="品牌"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
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
          name="available_to"
          label="截至有效期"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="cutout_image_url"
          label="图片地址"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="price"
          label="价格"
          rules={[
            { max: 10, message: '最多输入 10 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="flyer_id"
          label="传单ID"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="merchant_id"
          label="商家ID"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="merchant"
          label="商家名"
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