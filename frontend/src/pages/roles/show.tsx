import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const RoleShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  // data_scope 的显示映射
  const dataScopeMap: Record<number, string> = {
    0: "全部数据权限",
    1: "自定义数据权限",
  };

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID:</Text>
      <Text>{record?.id}</Text>
      <br />
      <Text strong>角色编码:</Text>
      <Text>{record?.code}</Text>
      <br />
      <Text strong>角色名称:</Text>
      <Text>{record?.name}</Text>
      <br />
      <Text strong>角色描述:</Text>
      <Text>{record?.description}</Text>
      <br />
      <Text strong>数据范围:</Text>
      <Text>{dataScopeMap[record?.data_scope ?? -1] ?? "未知"}</Text>
      <Text strong>创建人:</Text>
      <Text>{record?.creator}</Text>
      <br />
      <Text strong>更新人:</Text>
      <Text>{record?.updater}</Text>
      <br />

      <Text strong>创建时间:</Text>
      <Text>{record?.create_time}</Text>
      <br />

      <Text strong>更新时间:</Text>
      <Text>{record?.update_time}</Text>
    </Show>
  );
};
