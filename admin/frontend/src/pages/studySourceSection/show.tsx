import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const StudySourceSectionShow = () => {
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
      <Text strong>关联source的id:</Text>
      <Text>
        {
          record?.source_id
        }
      </Text>
      <br />
      <Text strong>对应章节:</Text>
      <Text>
        {
          record?.chapter
        }
      </Text>
      <br />
      <Text strong>段落:</Text>
      <Text>
        {
          record?.section
        }
      </Text>
      <br />
      <Text strong>page_start:</Text>
      <Text>
        {
          record?.page_start
        }
      </Text>
      <br />
      <Text strong>page_end:</Text>
      <Text>
        {
          record?.page_end
        }
      </Text>
      <br />
      <Text strong>原文摘要:</Text>
      <Text>
        {
          record?.anchor_text
        }
      </Text>
      <br />
    </Show>
  );
};