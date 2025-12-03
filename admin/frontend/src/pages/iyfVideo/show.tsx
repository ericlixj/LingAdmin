import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const IyfVideoShow = () => {
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
      <Text strong>IYF 平台 ID:</Text>
      <Text>
        {
          record?.iyf_id
        }
      </Text>
      <br />
      <Text strong>名称:</Text>
      <Text>
        {
          record?.title
        }
      </Text>
      <br />
      <Text strong>封面图片:</Text>
      <Text>
        {
          record?.cover_url
        }
      </Text>
      <br />
      <Text strong>简介:</Text>
      <Text>
        {
          record?.description
        }
      </Text>
      <br />
      <Text strong>类型:</Text>
      <Text>
        {
          record?.category
        }
      </Text>
      <br />
      <Text strong>年份:</Text>
      <Text>
        {
          record?.year
        }
      </Text>
      <br />
      <Text strong>地区:</Text>
      <Text>
        {
          record?.region
        }
      </Text>
      <br />
      <Text strong>评分:</Text>
      <Text>
        {
          record?.rating
        }
      </Text>
      <br />
      <Text strong>播放量:</Text>
      <Text>
        {
          record?.view_count
        }
      </Text>
      <br />
      <Text strong>爬取时间:</Text>
      <Text>
        {
          record?.crawl_date
        }
      </Text>
      <br />
    </Show>
  );
};