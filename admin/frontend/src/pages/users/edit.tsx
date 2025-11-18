import { Edit, useForm } from "@refinedev/antd";
import { useParsed } from "@refinedev/core";
import { Form, Input, Switch } from "antd";

export const UserEdit = () => {
  const { formProps, saveButtonProps } = useForm();
  const { id } = useParsed(); // 从 URL 解析 ID
  const recordId = Number(id);

  const canDelete = recordId !== 1;

  return (
    <Edit saveButtonProps={saveButtonProps} canDelete={canDelete}>
      <Form
        {...formProps}
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="email" label="Email" rules={[{ required: true }]} >
          <Input disabled />
        </Form.Item>
        <Form.Item name="full_name" label="Full Name">
          <Input />
        </Form.Item>
        <Form.Item name="is_active" label="Is Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
