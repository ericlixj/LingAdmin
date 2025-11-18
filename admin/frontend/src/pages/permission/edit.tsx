import { Edit, useForm } from "@refinedev/antd";
import { useParsed } from "@refinedev/core";
import { Form, Input } from "antd";

export const PermissionEdit = () => {
  const { formProps, saveButtonProps } = useForm();

  const { id } = useParsed(); // 从 URL 解析 ID
  const recordId = Number(id);

  const canDelete = recordId !== 1;

  return (
    <Edit saveButtonProps={saveButtonProps} canDelete={canDelete} >
      <Form
        {...formProps}
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item name="code" label="权限编码">
          <Input  />
        </Form.Item>
        <Form.Item name="name" label="权限名称">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="权限描述">
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
