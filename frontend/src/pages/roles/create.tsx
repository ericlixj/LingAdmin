import { Create, useForm, useTable } from "@refinedev/antd";
import { Form, Input, Select, Table } from "antd";
import { useState } from "react";

export const RoleCreate = () => {
  const { formProps, saveButtonProps } = useForm();
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);

  const { tableProps } = useTable({
    resource: "shop",
    pagination: {
      pageSize: 5,
    },
  });

  const handleFinish = (values: any) => {
    // 加入选中 shop 列表
    if (values.data_scope === 1) {
      values.shop_ids = selectedShopIds;
    } else {
      values.shop_ids = [];
    }
    formProps.onFinish?.(values);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        form={formProps.form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item name="code" label="角色编码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="角色描述">
          <Input />
        </Form.Item>
        <Form.Item
          name="data_scope"
          label="数据范围"
          initialValue={0}
          rules={[{ required: true, message: "请选择数据范围" }]}
        >
          <Select>
            <Select.Option value={0}>全部数据权限</Select.Option>
            <Select.Option value={1}>自定义数据权限</Select.Option>
          </Select>
        </Form.Item>

        {/* 动态展示 shop 表格 */}
        <Form.Item shouldUpdate={(prev, curr) => prev.data_scope !== curr.data_scope}>
          {({ getFieldValue }) =>
            getFieldValue("data_scope") === 1 && (
              <Form.Item label="选择店铺">
                <Table
                  {...tableProps}
                  rowKey="id"
                  rowSelection={{
                    type: "checkbox",
                    onChange: (selectedRowKeys) => {
                      setSelectedShopIds(selectedRowKeys as number[]);
                    },
                  }}
                  columns={[
                    { title: "ID", dataIndex: "id" },
                    { title: "店铺编码", dataIndex: "code" },
                    { title: "店铺名称", dataIndex: "name" },
                  ]}
                />
              </Form.Item>
            )
          }
        </Form.Item>
      </Form>
    </Create>
  );
};
