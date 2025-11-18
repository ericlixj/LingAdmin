import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const Main002Create = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
      status:"0",
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
          name="dic_code"
          label="字段编码"
          rules={[
            { required: true, message: '请输入字段编码' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="dic_name"
          label="字典名称"
          rules={[
            { required: true, message: '请输入字典名称' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' }
          ]}
        >
          <Select
            options={[
                { label: "开启", value: "0" },                { label: "关闭", value: "1" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
      </Form>
    </Create>
  );
};