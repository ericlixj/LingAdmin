import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { useEffect, useState } from "react";
import dataProvider from "../../dataProvider";

export const ShopEdit = () => {
  const { formProps, saveButtonProps } = useForm();
  

  const [appOptions, setAppOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    setLoadingApps(true);
    dataProvider
      .getList({
        resource: "app", // refine 中配置的资源名
        pagination: { pageSize: 100, current: 1 },
        sort: [{ field: "id", order: "asc" }],
      })
      .then(({ data }) => {
        const options = data.map((app: any) => ({
          label: app.name,  // 显示的名字
          value: app.code,  // 提交的值
        }));
        setAppOptions(options);
      })
      .finally(() => setLoadingApps(false));
  }, [dataProvider]);

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} form={formProps.form} layout="vertical">
        <Form.Item name="code" label="店铺编码">
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="name"
          label="店铺名称"
          rules={[{ required: true, message: "请输入店铺名称" }]}
        >
          <Input placeholder="请输入店铺名称" />
        </Form.Item>

        <Form.Item
          name="app_code"
          label="关联应用"
          rules={[{ required: true, message: "请选择关联应用" }]}
        >
          <Select
            placeholder="请选择关联应用"
            loading={loadingApps}
            options={appOptions}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item name="access_token" label="授权 Token">
          <Input placeholder="可选，填写授权 Token" />
        </Form.Item>

        <Form.Item name="refresh_token" label="刷新 Token">
          <Input placeholder="可选，填写刷新 Token" />
        </Form.Item>

        <Form.Item name="description" label="店铺描述">
          <Input placeholder="可选，填写店铺描述" />
        </Form.Item>
      </Form>
    </Edit>
  );
};
