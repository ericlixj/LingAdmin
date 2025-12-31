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
      <Text strong>地址:</Text>
      <Text>
        {
          record?.address
        }
      </Text>
      <br />
      <Text strong>纬度:</Text>
      <Text>
        {
          record?.latitude || "-"
        }
      </Text>
      <br />
      <Text strong>经度:</Text>
      <Text>
        {
          record?.longitude || "-"
        }
      </Text>
      <br />
    </Show>
  );
};