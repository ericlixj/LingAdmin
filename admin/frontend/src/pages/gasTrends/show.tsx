import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const GasTrendsShow = () => {
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
      <Text strong>邮编:</Text>
      <Text>
        {
          record?.postcode
        }
      </Text>
      <br />
      <Text strong>进入平均:</Text>
      <Text>
        {
          record?.today_avg
        }
      </Text>
      <br />
      <Text strong>今日最低:</Text>
      <Text>
        {
          record?.today_low
        }
      </Text>
      <br />
      <Text strong>趋势（up, down, stable）:</Text>
      <Text>
        {
          record?.trend
        }
      </Text>
      <br />
      <Text strong>爬取时间:</Text>
      <Text>
        {
          record?.crawl_time ? dayjs(record.crawl_time).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
    </Show>
  );
};