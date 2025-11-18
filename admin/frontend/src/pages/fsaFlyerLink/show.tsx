import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const FsaFlyerLinkShow = () => {
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
      <Text strong>传单ID:</Text>
      <Text>
        {
          record?.flyer_id
        }
      </Text>
      <br />
      <Text strong>FSA:</Text>
      <Text>
        {
          record?.fsa
        }
      </Text>
      <br />
    </Show>
  );
};