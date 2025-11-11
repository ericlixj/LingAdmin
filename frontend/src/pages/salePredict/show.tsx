import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const SalePredictShow = () => {
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
      <Text strong>统计年:</Text>
      <Text>
        {
          record?.stat_year
        }
      </Text>
      <br />
      <Text strong>统计月:</Text>
      <Text>
        {
          record?.stat_month
        }
      </Text>
      <br />
      <Text strong>sku:</Text>
      <Text>
        {
          record?.sku
        }
      </Text>
      <br />      
      <Text strong>实际销量:</Text>
      <Text>
        {
          record?.sales_quantity
        }
      </Text>
      <br />
      <Text strong>预测销量:</Text>
      <Text>
        {
          record?.predict_quantity
        }
      </Text>
      <br />      
    </Show>
  );
};