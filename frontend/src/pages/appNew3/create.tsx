import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const AppNew3Create = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="name"
          label="应用名称"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="code"
          label="应用编码"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="api_base_url"
          label="API基础URL"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="app_key"
          label="对接平台的 App Key"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="app_secret"
          label="对接平台的 App Secret"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="应用描述"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};