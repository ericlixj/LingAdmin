import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const UserShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID:</Text>
      <Text>{record?.id}</Text>
      <br />
      <Text strong>Email:</Text>
      <Text>{record?.email}</Text>
      <br />
      <Text strong>Full Name:</Text>
      <Text>{record?.full_name}</Text>
      <br />
      <Text strong>Active:</Text>
      <Text>{record?.is_active ? "Yes" : "No"}</Text>
      <br />
      <Text strong>Superuser:</Text>
      <Text>{record?.is_superuser ? "Yes" : "No"}</Text>
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
