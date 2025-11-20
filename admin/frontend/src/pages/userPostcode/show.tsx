import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const UserPostcodeShow = () => {
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
      <Text strong>用户ID:</Text>
      <Text>
        {
          record?.user_id
        }
      </Text>
      <br />
      <Text strong>邮编:</Text>
      <Text>
        {
          record?.postcode
        }
      </Text>
      <br />
      <Text strong>标识:</Text>
      <Text>
        {
          record?.label
        }
      </Text>
      <br />
    </Show>
  );
};