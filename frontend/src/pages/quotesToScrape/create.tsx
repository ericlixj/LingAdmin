import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const QuotesToScrapeCreate = () => {
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
          name="content"
          label="内容"
          rules={[
            { required: true, message: '请输入内容' },
            { max: 1000, message: '最多输入 1000 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="author"
          label="作者"
          rules={[
            { required: true, message: '请输入作者' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="tags"
          label="标签"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="author_birthday"
          label="作者生日"
          rules={[
            { required: true, message: '请输入作者生日' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="author_location"
          label="作者出生地"
          rules={[
            { required: true, message: '请输入作者出生地' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="author_bio"
          label="作者介绍"
          rules={[
            { required: true, message: '请输入作者介绍' },
            { max: 2000, message: '最多输入 2000 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
      </Form>
    </Create>
  );
};