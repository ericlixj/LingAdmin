import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const FsaManageShow = () => {
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
      <Text strong>FSA:</Text>
      <Text>
        {
          record?.fsa
        }
      </Text>
      <br />
      <Text strong>类型:</Text>
      <Text>
        {
          record?.delivery_center_type
        }
      </Text>
      <br />
      <Text strong>所在城市:</Text>
      <Text>
        {
          record?.city
        }
      </Text>
      <br />
      <Text strong>所在省份:</Text>
      <Text>
        {
          record?.province
        }
      </Text>
      <br />
      <Text strong>投递中心名称:</Text>
      <Text>
        {
          record?.delivery_center_name
        }
      </Text>
      <br />
      <Text strong>中心编号:</Text>
      <Text>
        {
          record?.center_number
        }
      </Text>
      <br />
    </Show>
  );
};