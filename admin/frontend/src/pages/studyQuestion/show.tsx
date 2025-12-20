import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyQuestionShow = () => {
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
      <Text strong>exam_id:</Text>
      <Text>
        {
          record?.exam_id
        }
      </Text>
      <br />
      <Text strong>type:</Text>
      <Text>
        {
          [{"label": "\u5355\u9009\u7c7b\u578b", "value": "single"}, {"label": "\u591a\u9009\u7c7b\u578b", "value": "multi"}, {"label": "\u5224\u65ad\u7c7b\u578b", "value": "judge"}].find(opt => opt.value === record?.type)?.label || record?.type
        }
      </Text>
      <br />
      <Text strong>题干:</Text>
      <Text>
        {
          record?.stem
        }
      </Text>
      <br />
      <Text strong>选项JSON:</Text>
      <Text>
        {
          record?.options
        }
      </Text>
      <br />
      <Text strong>答案JSON:</Text>
      <Text>
        {
          record?.answer
        }
      </Text>
      <br />
      <Text strong>官方解释:</Text>
      <Text>
        {
          record?.explanation_raw
        }
      </Text>
      <br />
      <Text strong>人话解释:</Text>
      <Text>
        {
          record?.explanation_human
        }
      </Text>
      <br />
      <Text strong>状态:</Text>
      <Text>
        {
          record?.status
        }
      </Text>
      <br />
    </Show>
  );
};