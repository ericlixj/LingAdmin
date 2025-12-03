import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "IYF \u5e73\u53f0 ID", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "iyf_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u540d\u79f0", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": 255, "name": "title", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5c01\u9762\u56fe\u7247", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "cover_url", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7b80\u4ecb", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "description", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7c7b\u578b", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "category", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5e74\u4efd", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "year", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5730\u533a", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "region", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u8bc4\u5206", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "rating", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u64ad\u653e\u91cf", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "view_count", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u722c\u53d6\u65f6\u95f4", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "crawl_date", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "datetime", "unique": false, "updatable": false}];

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

export const IyfVideoEdit = () => {
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
          name="iyf_id"
          label="IYF 平台 ID"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="名称"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="cover_url"
          label="封面图片"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="简介"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="category"
          label="类型"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="year"
          label="年份"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="region"
          label="地区"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="rating"
          label="评分"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="view_count"
          label="播放量"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="crawl_date"
          label="爬取时间"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
      </Form>

    </Edit>
  );
};