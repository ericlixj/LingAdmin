import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyQuestionKnowledgeShow = () => {
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
      <Text strong>question_id:</Text>
      <Text>
        {
          record?.question_id
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
      <Text strong>权重base100:</Text>
      <Text>
        {
          record?.weight
        }
      </Text>
      <br />
    </Show>
  );
};