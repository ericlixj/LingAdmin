import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker } from "antd";

export const CurdModel001Create = () => {
  const { formProps, saveButtonProps } = useForm();

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
          name="name"
          label="名称"
          rules={[
{ required: true, message: '请输入名称' },            { max: 100, message: '最多输入 100 个字符' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="code"
          label="编码"
          rules={[
{ required: true, message: '请输入编码' },            { max: 50, message: '最多输入 50 个字符' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="open_time"
          label="开启日期"
          rules={[
          ]}
        >
<DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { max: 128, message: '最多输入 128 个字符' },
          ]}
        >
          <Select>
              <Select.Option value="enabled">启用</Select.Option>
              <Select.Option value="disabled">停用</Select.Option>
          </Select>

        </Form.Item>
        <Form.Item
          name="open_function"
          label="开启功能"
          rules={[
          ]}
        >
          <Checkbox.Group
            options={[
                { label: "功能A", value: 1 },                 { label: "功能B", value: 2 },                 { label: "功能C", value: 3 }            ]}
          />

        </Form.Item>
        <Form.Item
          name="description"
          label="应用描述"
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