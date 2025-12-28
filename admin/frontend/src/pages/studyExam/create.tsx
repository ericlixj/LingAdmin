import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const StudyExamCreate = () => {
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
          name="code"
          label="考试编码"
          rules={[
            { required: true, message: '请输入考试编码' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { required: true, message: '请输入名称' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="staus"
          label="状态"
          rules={[
            
          ]}
        >
          <Select
            options={[
                { label: "开启", value: "1" },                { label: "关闭", value: "0" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="exam_duration"
          label="考试时长（分钟）"
          rules={[
            { type: "number", message: "必须是数字" },
            { required: true, message: "请输入考试时长" }
          ]}
          initialValue={60}
        >
              <InputNumber style={{ width: "100%" }} min={1} placeholder="考试时长（分钟）" />
        </Form.Item>
      </Form>
    </Create>
  );
};