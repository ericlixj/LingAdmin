import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyLearningItemShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Text strong>pk:</Text>
      <Text>
        {
          record?.id
        }
      </Text>
      <br />
      <Text strong>类型:</Text>
      <Text>
        {
          record?.type
        }
      </Text>
      <br />
      <Text strong>关联实体pk:</Text>
      <Text>
        {
          record?.ref_id
        }
      </Text>
      <br />
    </Show>
  );
};