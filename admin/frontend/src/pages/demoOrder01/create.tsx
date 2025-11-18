import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const DemoOrder01Create = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
      order_status:"enabled",
      open_function:"None",
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      open_function: (values.open_function || []).join(","),
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="order_code"
          label="订单编码"
          rules={[
            { required: true, message: '请输入订单编码' },
            { max: 50, message: '最多输入 50 个字符' }
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
            { required: true, message: '请输入订单状态' },
            { max: 128, message: '最多输入 128 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "启用", value: "enabled" },                { label: "停用", value: "disabled" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="open_function"
          label="开启功能"
          rules={[
            
          ]}
        >
          <Checkbox.Group
            options={[
                { label: "功能A", value: "1" },                 { label: "功能B", value: "2" },                 { label: "功能C", value: "3" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="order_info"
          label="订单信息"
          rules={[
            { max: 1000, message: '最多输入 1000 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="aaa"
          label="测试"
          rules={[
            { max: 222, message: '最多输入 222 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};