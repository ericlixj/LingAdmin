import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const StudyQuestionCreate = () => {
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
          label="exam_id"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="type"
          label="type"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "单选类型", value: "single" },                { label: "多选类型", value: "multi" },                { label: "判断类型", value: "judge" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="stem"
          label="题干"
          rules={[
            { required: true, message: '请输入题干' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="options"
          label="选项JSON"
          rules={[
            { required: true, message: '请输入选项JSON' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="answer"
          label="答案JSON"
          rules={[
            { required: true, message: '请输入答案JSON' },
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="explanation_raw"
          label="官方解释"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="explanation_human"
          label="人话解释"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};