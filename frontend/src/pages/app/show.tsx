import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const AppShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID:</Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>应用名称:</Text>
      <Text>{record?.name}</Text>
      <br />

      <Text strong>应用编码:</Text>
      <Text>{record?.code}</Text>
      <br />

      <Text strong>AppKey:</Text>
      <Text>{record?.app_key}</Text>
      <br />

      <Text strong>AppSecret:</Text>
      <Text>{record?.app_secret}</Text>
      <br />

      <Text strong>API 基础 URL:</Text>
      <Text>{record?.api_base_url}</Text>
      <br />

      <Text strong>应用描述:</Text>
      <Text>{record?.description}</Text>
      <br />

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
