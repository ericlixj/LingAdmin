import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": true, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u7528\u6237\u540d", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 100, "name": "name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5e74\u9f84", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "age", "nullable": true, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "0", "description": "\u6027\u522b", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "gender", "nullable": true, "options": [{"label": "\u672a\u77e5", "value": 0}, {"label": "\u7537", "value": 1}, {"label": "\u5973", "value": 2}], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": true, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5907\u6ce8", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 1000, "name": "remark", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u751f\u65e5", "form_type": "date", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "birth_day", "nullable": true, "options": [], "primary_key": false, "query_type": "in", "queryable": true, "required": true, "sortable": true, "type": "datetime", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7231\u597d2", "form_type": "checkbox", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "hobby2", "nullable": false, "options": [{"label": "\u9605\u8bfb", "value": 1}, {"label": "\u65c5\u884c", "value": 2}, {"label": "\u97f3\u4e50", "value": 3}, {"label": "\u8fd0\u52a8", "value": 4}, {"label": "\u6444\u5f71", "value": 5}, {"label": "\u7ed8\u753b", "value": 6}, {"label": "\u70f9\u996a", "value": 7}, {"label": "\u7535\u5f71", "value": 8}, {"label": "\u6e38\u620f", "value": 9}, {"label": "\u5199\u4f5c", "value": 10}], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u7231\u597d", "form_type": "checkbox", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "hobby", "nullable": true, "options": [{"label": "\u9605\u8bfb", "value": "reading"}, {"label": "\u65c5\u884c", "value": "travel"}, {"label": "\u97f3\u4e50", "value": "music"}, {"label": "\u8fd0\u52a8", "value": "sports"}, {"label": "\u6444\u5f71", "value": "photography"}, {"label": "\u7ed8\u753b", "value": "painting"}, {"label": "\u70f9\u996a", "value": "cooking"}, {"label": "\u7535\u5f71", "value": "movies"}, {"label": "\u6e38\u620f", "value": "gaming"}, {"label": "\u5199\u4f5c", "value": "writing"}], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "unknown", "description": "\u6027\u522b2", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "gender2", "nullable": false, "options": [{"label": "\u672a\u77e5", "value": "unknown"}, {"label": "\u7537", "value": "man"}, {"label": "\u5973", "value": "women"}], "primary_key": false, "query_type": "eq", "queryable": false, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const DemoUserEdit = () => {
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
      hobby2: (values.hobby2 || []).join(","),      hobby: (values.hobby || []).join(","),    };
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
          name="name"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="age"
          label="年龄"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="gender"
          label="性别"
          rules={[
            
          ]}
        >
            <Select>
                <Select.Option value="0">未知</Select.Option>
                <Select.Option value="1">男</Select.Option>
                <Select.Option value="2">女</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[
            { max: 1000, message: '最多输入 1000 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="birth_day"
          label="生日"
          rules={[
            { required: true, message: '请输入生日' }
          ]}
        >

            <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="hobby2"
          label="爱好2"
          rules={[
            
          ]}
        >
            <Checkbox.Group
              options={[
                  { label: "阅读", value: "1" },                   { label: "旅行", value: "2" },                   { label: "音乐", value: "3" },                   { label: "运动", value: "4" },                   { label: "摄影", value: "5" },                   { label: "绘画", value: "6" },                   { label: "烹饪", value: "7" },                   { label: "电影", value: "8" },                   { label: "游戏", value: "9" },                   { label: "写作", value: "10" }              ]}
            />
        </Form.Item>
        <Form.Item
          name="hobby"
          label="爱好"
          rules={[
            
          ]}
        >
            <Checkbox.Group
              options={[
                  { label: "阅读", value: "reading" },                   { label: "旅行", value: "travel" },                   { label: "音乐", value: "music" },                   { label: "运动", value: "sports" },                   { label: "摄影", value: "photography" },                   { label: "绘画", value: "painting" },                   { label: "烹饪", value: "cooking" },                   { label: "电影", value: "movies" },                   { label: "游戏", value: "gaming" },                   { label: "写作", value: "writing" }              ]}
            />
        </Form.Item>
        <Form.Item
          name="gender2"
          label="性别2"
          rules={[
            { required: true, message: '请输入性别2' }
          ]}
        >
            <Select>
                <Select.Option value="unknown">未知</Select.Option>
                <Select.Option value="man">男</Select.Option>
                <Select.Option value="women">女</Select.Option>
            </Select>
        </Form.Item>
      </Form>

    </Edit>
  );
};