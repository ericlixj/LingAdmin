import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const StudySessionCreate = () => {
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
          name="user_id"
          label="user_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="exam_id"
          label="exam_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="mode"
          label="学习模式"
          rules={[
            { required: true, message: '请输入学习模式' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "考试", value: "exam" },                { label: "练习", value: "practice" },                { label: "复习", value: "review" },                { label: "FlashCard", value: "flashcard" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="start_time"
          label="start_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="end_time"
          label="end_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="score"
          label="score"
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