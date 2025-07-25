import { Edit, useForm, useTable } from "@refinedev/antd";
import { useTranslate } from "@refinedev/core";
import { Form, Input, Select, Table } from "antd";
import { useEffect, useState } from "react";

export const RoleEdit = () => {
  const t = useTranslate();
  const { formProps, saveButtonProps } = useForm();
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);

  const { tableProps } = useTable({
    resource: "shop",
    pagination: {
      pageSize: 5,
    },
  });

  useEffect(() => {
    if (formProps.initialValues?.shop_ids) {
      setSelectedShopIds(formProps.initialValues.shop_ids);
    }
  }, [formProps.initialValues]);

  const handleFinish = (values: any) => {
    if (values.data_scope === 1) {
      values.shop_ids = selectedShopIds;
    } else {
      values.shop_ids = [];
    }
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

        <Form.Item
          name="data_scope"
          label={t("role.fields.data_scope")}
          rules={[{ required: true, message: t("role.messages.select_data_scope") }]}
        >
          <Select>
            <Select.Option value={0}>
              {t("role.enums.data_scope.all")}
            </Select.Option>
            <Select.Option value={1}>
              {t("role.enums.data_scope.custom")}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item shouldUpdate={(prev, curr) => prev.data_scope !== curr.data_scope}>
          {({ getFieldValue }) =>
            getFieldValue("data_scope") === 1 && (
              <Form.Item label={t("role.fields.shop_ids")}>
                <Table
                  {...tableProps}
                  rowKey="id"
                  rowSelection={{
                    type: "checkbox",
                    selectedRowKeys: selectedShopIds,
                    onChange: (selectedRowKeys) => {
                      setSelectedShopIds(selectedRowKeys as number[]);
                    },
                  }}
                  columns={[
                    { title: "ID", dataIndex: "id" },
                    { title: t("shop.fields.code"), dataIndex: "code" },
                    { title: t("shop.fields.name"), dataIndex: "name" },
                  ]}
                />
              </Form.Item>
            )
          }
        </Form.Item>
      </Form>
    </Edit>
  );
};
