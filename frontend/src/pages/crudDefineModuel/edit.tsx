import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin } from "antd";
import { MenuTreeSelect } from "../../components/common/MenuTreeSelect";

const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": null, "name": "id", "nullable": false, "options": null, "primary_key": true, "query_type": null, "queryable": false, "required": true, "sortable": false, "type": "int", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u6a21\u5757\u540d\u79f0", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 100, "name": "module_name", "nullable": false, "options": null, "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u6a21\u5757\u6807\u8bc6", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 50, "name": "label", "nullable": false, "options": null, "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": null, "description": "\u63cf\u8ff0\u4fe1\u606f", "form_type": "textarea", "index": false, "insertable": true, "listable": false, "max_length": 255, "name": "description", "nullable": true, "options": null, "primary_key": false, "query_type": null, "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

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

export const CrudDefineModuelEdit = () => {
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
          name="parent_menu_id"
          label="上级菜单"
        >
          <MenuTreeSelect />
        </Form.Item>             
        <Form.Item
          name="module_name"
          label="模块编码（使用驼峰命名且首字母小写，例如：systemLog）"
          rules={[
{ required: true, message: '请输入模块编码' },            { max: 100, message: '最多输入 100 个字符' },
          ]}
        >
            <Input />
        </Form.Item>
        <Form.Item
          name="label"
          label="模块名称 （例如：系统日志）"
          rules={[
{ required: true, message: '请输入模块名称' },            { max: 50, message: '最多输入 50 个字符' },
          ]}
        >
            <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述信息"
          rules={[
            { max: 255, message: '最多输入 255 个字符' },
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
      </Form>

    </Edit>
  );
};