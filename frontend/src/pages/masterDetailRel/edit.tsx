import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Select, Spin } from "antd";

function prepareInitialValues(record: Record<string, any>, fields: string[]) {
  const result: Record<string, any> = {};
  fields.forEach((field) => {
    const value = record[field];
    if (value && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      result[field] = dayjs(value);
    } else {
      result[field] = value;
    }
  });
  return result;
}

export const MasterDetailRelEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const record = queryResult?.data?.data;
  const form = formProps.form;
  const [initialized, setInitialized] = useState(false);

  // ✅ 联动状态
  const [detailModuleId, setDetailModuleId] = useState<number | undefined>();

  // ✅ 初始化数据到表单中（仅一次）
  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      const initValues = prepareInitialValues(record, [
        "master_module_id",
        "detail_module_id",
        "rel_filed_name",
      ]);
      form.setFieldsValue(initValues);
      setDetailModuleId(initValues.detail_module_id); // 设置子表模块初始值
      setInitialized(true);
    }
  }, [initialized, record]);

  // ✅ 主表模块下拉
  const { selectProps: masterModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });

  // ✅ 子表模块下拉
  const { selectProps: detailModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });

  // ✅ 联动字段下拉，根据 detailModuleId 请求
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
      queryKey: ["filed_select", detailModuleId], // 确保每次刷新
    },
  });

  const handleFinish = (values: any) => {
    return formProps.onFinish?.(values);
  };

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
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
              setDetailModuleId(val); // ✅ 设置子表模块 ID
              form.setFieldsValue({ rel_filed_name: undefined }); // ✅ 清空字段值
            }}
          />
        </Form.Item>

        {/* 子表字段 */}
        <Form.Item
          name="rel_filed_name"
          label="子表关联字段名"
          rules={[{ required: true, message: "请选择子表关联字段名" }]}
        >
          <Select {...detailRelFiledSelectProps} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
