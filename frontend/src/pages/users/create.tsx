import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Switch } from "antd";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form 
        {...formProps} 
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="full_name" label="Full Name">
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
