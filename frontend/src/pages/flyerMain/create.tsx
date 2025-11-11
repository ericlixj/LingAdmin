import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const FlyerMainCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="merchant_id"
          label="商家id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="name"
          label="传单名称"
          rules={[
            
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
          name="categories"
          label="分类JSON"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="fly_id"
          label="传单ID"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};