import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyKnowledgeNodeShow = () => {
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
      <Text strong>关联exam的id:</Text>
      <Text>
        {
          record?.exam_id
        }
      </Text>
      <br />
      <Text strong>code:</Text>
      <Text>
        {
          record?.code
        }
      </Text>
      <br />
      <Text strong>标题:</Text>
      <Text>
        {
          record?.title
        }
      </Text>
      <br />
      <Text strong>描述:</Text>
      <Text>
        {
          record?.description
        }
      </Text>
      <br />
      <Text strong>importance:</Text>
      <Text>
        {
          [{"label": "\u9ad8", "value": "high"}, {"label": "\u4e2d", "value": "mid"}, {"label": "\u4f4e", "value": "low"}].find(opt => opt.value === record?.importance)?.label || record?.importance
        }
      </Text>
      <br />
    </Show>
  );
};