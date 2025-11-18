import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const Product4SephoraCreate = () => {
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
          name="productId"
          label="产品ID"
          rules={[
            { required: true, message: '请输入产品ID' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="skuId"
          label="SKUID"
          rules={[
            { required: true, message: '请输入SKUID' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="productName"
          label="产品名称"
          rules={[
            { required: true, message: '请输入产品名称' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="listPrice"
          label="价格"
          rules={[
            { required: true, message: '请输入价格' },
            { max: 20, message: '最多输入 20 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationType"
          label="规格"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationTypeDisplayName"
          label="规格名称"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationValue"
          label="规格值"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="images"
          label="图片"
          rules={[
            { max: 10000, message: '最多输入 10000 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
      </Form>
    </Create>
  );
};