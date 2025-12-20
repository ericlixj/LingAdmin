import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudyExamShow = () => {
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
      <Text strong>考试编码:</Text>
      <Text>
        {
          record?.code
        }
      </Text>
      <br />
      <Text strong>名称:</Text>
      <Text>
        {
          record?.name
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
      <Text strong>状态:</Text>
      <Text>
        {
          [{"label": "\u5f00\u542f", "value": 1}, {"label": "\u5173\u95ed", "value": 0}].find(opt => opt.value === record?.staus)?.label || record?.staus
        }
      </Text>
      <br />
    </Show>
  );
};