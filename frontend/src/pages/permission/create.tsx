import { Create, useForm } from "@refinedev/antd";
import { useTranslate } from "@refinedev/core";
import { Form, Input } from "antd";

export const PermissionCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form 
        {...formProps} 
        form={formProps.form}
        layout="vertical"
      >
        <Form.Item
          name="code"
          label={t("permission.fields.code")}
          rules={[{ required: true, message: t("permission.messages.code_required") }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t("permission.fields.name")}
          rules={[{ required: true, message: t("permission.messages.name_required") }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label={t("permission.fields.description")}
        >
          <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};
