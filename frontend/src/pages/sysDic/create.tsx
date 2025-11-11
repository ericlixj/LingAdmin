import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useTranslate } from "@refinedev/core";

export const SysDicCreate = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    formProps.form?.setFieldsValue({ status: "0" });
  }, [formProps.form]);

  const handleFinish = (values: any) => {
    const processed = { ...values };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="dic_code"
          label={t("sysDic.fields.dic_code")}
          rules={[
            { required: true, message: t("sysDic.rules.dic_code.required") },
            { max: 50, message: t("sysDic.rules.dic_code.max") },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="dic_name"
          label={t("sysDic.fields.dic_name")}
          rules={[
            { required: true, message: t("sysDic.rules.dic_name.required") },
            { max: 100, message: t("sysDic.rules.dic_name.max") },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="status"
          label={t("sysDic.fields.status")}
          rules={[{ required: true, message: t("sysDic.rules.status.required") }]}
        >
          <Select
            options={[
              { label: t("sysDic.options.status.0"), value: "0" },
              { label: t("sysDic.options.status.1"), value: "1" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="remark"
          label={t("sysDic.fields.remark")}
          rules={[{ max: 255, message: t("sysDic.rules.remark.max") }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Create>
  );
};
