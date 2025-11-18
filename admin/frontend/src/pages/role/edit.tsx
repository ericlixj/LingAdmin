import { Edit, useForm, useTable } from "@refinedev/antd";
import { useTranslate } from "@refinedev/core";
import { Form, Input, Select, Table } from "antd";

export const RoleEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  const handleFinish = (values: any) => {
    formProps.onFinish?.(values);
  };

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} form={formProps.form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="code" label={t("role.fields.code")}>
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="name"
          label={t("role.fields.name")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label={t("role.fields.description")}
        >
          <Input />
        </Form.Item>
      </Form>
    </Edit>
  );
};
