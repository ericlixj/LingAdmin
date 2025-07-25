import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker } from "antd";

export const CrudDefineModuelCreate = () => {
  const { formProps, saveButtonProps } = useForm();

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
          name="module_name"
          label="模块编码（使用驼峰命名且首字母小写，例如：systemLog）"
          rules={[
{ required: true, message: '请输入模块编码' },            { max: 100, message: '最多输入 100 个字符' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="label"
          label="模块名称 （例如：系统日志）"
          rules={[
{ required: true, message: '请输入模块名称' },            { max: 50, message: '最多输入 50 个字符' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述信息"
          rules={[
            { max: 255, message: '最多输入 255 个字符' },
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
      </Form>
    </Create>
  );
};