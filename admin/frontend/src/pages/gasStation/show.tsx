import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const GasStationShow = () => {
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
      <Text strong>加油站标识:</Text>
      <Text>
        {
          record?.station_id
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
      <Text strong>从搜索postcode到station距离,km:</Text>
      <Text>
        {
          record?.distance
        }
      </Text>
      <br />
      <Text strong>基准postcode:</Text>
      <Text>
        {
          record?.postcode
        }
      </Text>
      <br />
      <Text strong>地址:</Text>
      <Text>
        {
          record?.address
        }
      </Text>
      <br />
    </Show>
  );
};