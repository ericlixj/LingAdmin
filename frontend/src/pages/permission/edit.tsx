import { Edit, useForm } from "@refinedev/antd";
import { useParsed, useTranslate } from "@refinedev/core";
import { Form, Input } from "antd";

export const PermissionEdit = () => {
  const t = useTranslate();
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
        <Form.Item
          name="code"
          label={t("permission.fields.code")}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t("permission.fields.name")}
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
    </Edit>
  );
};
