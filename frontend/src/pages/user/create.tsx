import { Create, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";
import { DeptTreeSelect } from "../../components/common/DeptTreeSelect";

export const UserCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} form={formProps.form} layout="vertical">
        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password />
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
      </Form>
    </Create>
  );
};
