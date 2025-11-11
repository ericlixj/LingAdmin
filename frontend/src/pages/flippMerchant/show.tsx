import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const FlippMerchantShow = () => {
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
      <Text strong>商家名:</Text>
      <Text>
        {
          record?.merchant
        }
      </Text>
      <br />
      <Text strong>店铺id:</Text>
      <Text>
        {
          record?.merchant_id
        }
      </Text>
      <br />
      <Text strong>商家logo:</Text>
      <Text>
        {
          record?.merchant_logo
        }
      </Text>
      <br />
    </Show>
  );
};