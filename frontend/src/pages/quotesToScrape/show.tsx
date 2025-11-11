import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const QuotesToScrapeShow = () => {
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
      <Text strong>内容:</Text>
      <Text>
        {
          record?.content
        }
      </Text>
      <br />
      <Text strong>作者:</Text>
      <Text>
        {
          record?.author
        }
      </Text>
      <br />
      <Text strong>标签:</Text>
      <Text>
        {
          record?.tags
        }
      </Text>
      <br />
      <Text strong>作者生日:</Text>
      <Text>
        {
          record?.author_birthday
        }
      </Text>
      <br />
      <Text strong>作者出生地:</Text>
      <Text>
        {
          record?.author_location
        }
      </Text>
      <br />
      <Text strong>作者介绍:</Text>
      <Text>
        {
          record?.author_bio
        }
      </Text>
      <br />
    </Show>
  );
};