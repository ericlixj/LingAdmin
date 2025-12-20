import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const StudyKnowledgeNodeCreate = () => {
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
          name="exam_id"
          label="关联exam的id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="code"
          label="code"
          rules={[
            { required: true, message: '请输入code' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="importance"
          label="importance"
          rules={[
            { required: true, message: '请输入importance' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "高", value: "high" },                { label: "中", value: "mid" },                { label: "低", value: "low" }            ]}
          />

        </Form.Item>
      </Form>
    </Create>
  );
};