import { Show, useSelect } from "@refinedev/antd";
import { Typography, Spin } from "antd";
import { useShow, useDelete } from "@refinedev/core";

const { Text } = Typography;

export const MasterDetailRelShow = () => {
  const { queryResult, isLoading } = useShow();
  console.log(queryResult)
  const record = queryResult?.data?.data;

  // 拉取主表模块列表（和 list 页面保持一致）
  const { selectProps: masterModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });
  const moduleOptions = masterModuleSelectProps.options ?? [];

  // 子表模块列表（同接口）
  const { selectProps: detailModuleSelectProps } = useSelect({
    resource: "crudDefineModuel/md_select",
    optionLabel: "label",
    optionValue: "id",
  });
  const detailModuleOptions = detailModuleSelectProps.options ?? [];

  // 字段列表
  const { selectProps: fieldSelectProps } = useSelect({
    resource: "crudDefineFileds/filed_select",
    optionLabel: "description",
    optionValue: "name",
    queryOptions: {
      enabled: true,
    },
  });
  const fieldOptions = fieldSelectProps.options ?? [];

  // 构造映射，方便展示 label
  const moduleLabelMap = Object.fromEntries(
    moduleOptions.map((opt) => [String(opt.value), opt.label])
  );

  const detailModuleLabelMap = Object.fromEntries(
    detailModuleOptions.map((opt) => [String(opt.value), opt.label])
  );

  const fieldLabelMap = Object.fromEntries(
    fieldOptions.map((opt) => [String(opt.value), opt.label])
  );

  if (isLoading) {
    return <Spin style={{ margin: 100 }} />;
  }

  return (
    <Show>
      <Text strong>主键: </Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>主表模块: </Text>
      <Text>{moduleLabelMap[String(record?.master_module_id)] || record?.master_module_id}</Text>
      <br />

      <Text strong>子表模块: </Text>
      <Text>{detailModuleLabelMap[String(record?.detail_module_id)] || record?.detail_module_id}</Text>
      <br />

      <Text strong>子表关联字段名: </Text>
      <Text>{fieldLabelMap[String(record?.rel_filed_name)] || record?.rel_filed_name}</Text>
      <br />
    </Show>
  );
};
