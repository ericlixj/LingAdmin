import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Select } from "antd";
import { useState, useEffect } from "react";
import { MenuTreeSelect } from "../../components/common/MenuTreeSelect";

export const MasterDetailRelCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 监听子表模块ID，控制字段接口请求
  const [detailModuleId, setDetailModuleId] = useState<number | undefined>();

  // 主表模块列表（接口不变，固定请求）
  const { selectProps: masterModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select?needExludeExist=1",
    optionLabel: "label",
    optionValue: "id",
  });

  // 子表模块列表，接口不变
  const { selectProps: detailModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select?needExludeExist=1",
    optionLabel: "label",
    optionValue: "id",
  });

  // 子表字段列表，动态请求
  const { selectProps: detailRelFiledSelectProps } = useSelect({
    resource: "crudDefineFileds/filed_select",
    optionLabel: "description",
    optionValue: "name",
    filters: [
      {
        field: "module_id",
        operator: "eq",
        value: detailModuleId,
      },
    ],
    queryOptions: {
      enabled: !!detailModuleId,
    },
  });
  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="parent_menu_id"
          label="上级菜单"
        >
          <MenuTreeSelect />
        </Form.Item>         
        {/* 主表模块 */}
        <Form.Item
          name="master_module_id"
          label="主表模块"
          rules={[{ required: true, message: "请选择主表模块" }]}
        >
          <Select {...masterModuleSelectProps} />
        </Form.Item>

        {/* 子表模块 */}
        <Form.Item
          name="detail_module_id"
          label="子表模块"
          rules={[{ required: true, message: "请选择子表模块" }]}
        >
          <Select
            {...detailModuleSelectProps}
            onChange={(val) => {
              setDetailModuleId(val);
              formProps.form.setFieldsValue({ rel_filed_name: undefined }); // 切换时清空字段
            }}
          />
        </Form.Item>

        {/* 子表关联字段 */}
        <Form.Item
          name="rel_filed_name"
          label="子表关联字段名"
          rules={[{ required: true, message: "请选择子表关联字段名" }]}
        >
          <Select {...detailRelFiledSelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
