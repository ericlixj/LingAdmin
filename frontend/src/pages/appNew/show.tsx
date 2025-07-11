import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const AppNewShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>应用名称:</Text>
      <Text>{record?.name}</Text>
      <br />
      <Text strong>应用编码:</Text>
      <Text>{record?.code}</Text>
      <br />
      <Text strong>API基础URL:</Text>
      <Text>{record?.api_base_url}</Text>
      <br />
      <Text strong>对接平台的 App Key:</Text>
      <Text>{record?.app_key}</Text>
      <br />
      <Text strong>对接平台的 App Secret:</Text>
      <Text>{record?.app_secret}</Text>
      <br />
      <Text strong>应用描述:</Text>
      <Text>{record?.description}</Text>
      <br />
      <Text strong>Id:</Text>
      <Text>{record?.id}</Text>
      <br />
    </Show>
  );
};