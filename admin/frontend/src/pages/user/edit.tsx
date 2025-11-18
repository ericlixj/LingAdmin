import { Edit, useForm } from "@refinedev/antd";
import { useParsed } from "@refinedev/core";
import { Form, Input, Switch } from "antd";
import { DeptTreeSelect } from "../../components/common/DeptTreeSelect";

export const UserEdit = () => {
  const { formProps, saveButtonProps } = useForm();
  const { id } = useParsed();
  const recordId = Number(id);
  const canDelete = recordId !== 1;

  return (
    <Edit saveButtonProps={saveButtonProps} canDelete={canDelete}>
      <Form {...formProps} form={formProps.form} layout="vertical">
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item name="full_name" label="Full Name">
          <Input />
        </Form.Item>

        <Form.Item
          name="dept_id"
          label="所属部门"
          rules={[{ required: true, message: "请选择所属部门" }]}
        >
          <DeptTreeSelect />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="Is Active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Edit>
  );
};
