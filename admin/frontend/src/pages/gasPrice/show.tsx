import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const GasPriceShow = () => {
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
      <Text strong>加油站主键:</Text>
      <Text>
        {
          record?.station_id
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
      <Text strong>油品:</Text>
      <Text>
        {
          record?.fuel_product
        }
      </Text>
      <br />
      <Text strong>现金价格:</Text>
      <Text>
        {
          record?.cash_price
        }
      </Text>
      <br />
      <Text strong>格式化现金价格:</Text>
      <Text>
        {
          record?.cash_formatted_price
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