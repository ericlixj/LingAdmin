import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const FlyerDetailsCreate = () => {
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
    </Create>
  );
};