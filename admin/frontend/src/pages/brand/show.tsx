import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const BrandShow = () => {
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
      <Text strong>英文名称:</Text>
      <Text>
        {
          record?.en_name
        }
      </Text>
      <br />
      <Text strong>简体中文名称:</Text>
      <Text>
        {
          record?.cn_name
        }
      </Text>
      <br />
      <Text strong>繁体中文名称:</Text>
      <Text>
        {
          record?.hk_name
        }
      </Text>
      <br />
      <Text strong>原始名称:</Text>
      <Text>
        {
          record?.original_name
        }
      </Text>
      <br />
    </Show>
  );
};