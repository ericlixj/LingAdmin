import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyKnowledgeSourceSectionShow = () => {
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
      <Text strong>knowledge_node_id:</Text>
      <Text>
        {
          record?.knowledge_node_id
        }
      </Text>
      <br />
      <Text strong>source_section_id:</Text>
      <Text>
        {
          record?.source_section_id
        }
      </Text>
      <br />
    </Show>
  );
};