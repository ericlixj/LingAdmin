import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const DemoUser002Show = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>主键:</Text>
      <Text>
        {
          record?.id
        }
      </Text>
      <br />
      <Text strong>名称:</Text>
      <Text>
        {
          record?.name
        }
      </Text>
      <br />
      <Text strong>创建用户部门ID:</Text>
      <Text>
        {
          record?.dept_id
        }
      </Text>
      <br />
    </Show>
  );
};