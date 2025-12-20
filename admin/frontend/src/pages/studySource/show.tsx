import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudySourceShow = () => {
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
      <Text strong>type:</Text>
      <Text>
        {
          record?.type
        }
      </Text>
      <br />
      <Text strong>title:</Text>
      <Text>
        {
          record?.title
        }
      </Text>
      <br />
      <Text strong>version:</Text>
      <Text>
        {
          record?.version
        }
      </Text>
      <br />
    </Show>
  );
};