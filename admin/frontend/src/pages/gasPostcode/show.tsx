import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const GasPostcodeShow = () => {
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
      <Text strong>显示名称:</Text>
      <Text>
        {
          record?.display_name
        }
      </Text>
      <br />
      <Text strong>维度:</Text>
      <Text>
        {
          record?.latitude
        }
      </Text>
      <br />
      <Text strong>经度:</Text>
      <Text>
        {
          record?.longitude
        }
      </Text>
      <br />
      <Text strong>区域编码:</Text>
      <Text>
        {
          record?.region_code
        }
      </Text>
      <br />
    </Show>
  );
};