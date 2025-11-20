import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u52a0\u6cb9\u7ad9\u6807\u8bc6", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "station_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 255, "name": "name", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u4ece\u641c\u7d22postcode\u5230station\u8ddd\u79bb,km", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 10, "name": "distance", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u57fa\u51c6postcode", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 64, "name": "postcode", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u5730\u5740", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "address", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const GasStationEdit = () => {
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
          label="加油站标识"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="distance"
          label="从搜索postcode到station距离,km"
          rules={[
            { max: 10, message: '最多输入 10 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="postcode"
          label="基准postcode"
          rules={[
            { required: true, message: '请输入基准postcode' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="address"
          label="地址"
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