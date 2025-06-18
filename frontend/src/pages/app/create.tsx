import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const AppCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item name="name" label="应用名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="code" label="应用编码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="app_key" label="AppKey">
          <Input />
        </Form.Item>
        <Form.Item name="app_secret" label="AppSecret">
          <Input />
        </Form.Item>
        <Form.Item name="api_base_url" label="API 基础 URL">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="应用描述">
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
