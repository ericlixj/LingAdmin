import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

export const PermissionCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form 
        {...formProps} 
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="code" label="权限编码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="权限名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="权限描述">
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
