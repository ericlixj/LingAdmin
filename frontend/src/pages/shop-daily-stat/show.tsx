import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";

const { Text } = Typography;

export const ShopDailyStatShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>ID:</Text>
      <Text>{record?.id}</Text>
      <br />

      <Text strong>店铺编码:</Text>
      <Text>{record?.shop_id}</Text>
      <br />

      <Text strong>年份:</Text>
      <Text>{record?.year}</Text>
      <br />

      <Text strong>月份:</Text>
      <Text>{record?.month}</Text>
      <br />

      <Text strong>日期:</Text>
      <Text>{record?.day}</Text>
      <br />

      <Text strong>PV:</Text>
      <Text>{record?.pv}</Text>
      <br />

      <Text strong>UV:</Text>
      <Text>{record?.uv}</Text>
      <br />

      <Text strong>销量:</Text>
      <Text>{record?.sales_volume}</Text>
      <br />

      <Text strong>销售金额:</Text>
      <Text>{record?.sales_amount}</Text>
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
