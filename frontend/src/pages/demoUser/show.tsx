import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const DemoUserShow = () => {
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
      <Text strong>用户名:</Text>
      <Text>
        {
          record?.name
        }
      </Text>
      <br />
      <Text strong>年龄:</Text>
      <Text>
        {
          record?.age
        }
      </Text>
      <br />
      <Text strong>性别:</Text>
      <Text>
        {
          [{"label": "\u672a\u77e5", "value": 0}, {"label": "\u7537", "value": 1}, {"label": "\u5973", "value": 2}].find(opt => opt.value === record?.gender)?.label || record?.gender
        }
      </Text>
      <br />
      <Text strong>备注:</Text>
      <Text>
        {
          record?.remark
        }
      </Text>
      <br />
      <Text strong>生日:</Text>
      <Text>
        {
          record?.birth_day ? dayjs(record.birth_day).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
      <Text strong>爱好2:</Text>
      <Text>
        {
          (record?.hobby2 || "")
            .split(",")
            .map(val =>
              [{"label": "\u9605\u8bfb", "value": 1}, {"label": "\u65c5\u884c", "value": 2}, {"label": "\u97f3\u4e50", "value": 3}, {"label": "\u8fd0\u52a8", "value": 4}, {"label": "\u6444\u5f71", "value": 5}, {"label": "\u7ed8\u753b", "value": 6}, {"label": "\u70f9\u996a", "value": 7}, {"label": "\u7535\u5f71", "value": 8}, {"label": "\u6e38\u620f", "value": 9}, {"label": "\u5199\u4f5c", "value": 10}].find(opt => opt.value == val || opt.value == Number(val))?.label
            )
            .filter(Boolean)
            .join(", ")
        }
      </Text>
      <br />
      <Text strong>爱好:</Text>
      <Text>
        {
          (record?.hobby || "")
            .split(",")
            .map(val =>
              [{"label": "\u9605\u8bfb", "value": "reading"}, {"label": "\u65c5\u884c", "value": "travel"}, {"label": "\u97f3\u4e50", "value": "music"}, {"label": "\u8fd0\u52a8", "value": "sports"}, {"label": "\u6444\u5f71", "value": "photography"}, {"label": "\u7ed8\u753b", "value": "painting"}, {"label": "\u70f9\u996a", "value": "cooking"}, {"label": "\u7535\u5f71", "value": "movies"}, {"label": "\u6e38\u620f", "value": "gaming"}, {"label": "\u5199\u4f5c", "value": "writing"}].find(opt => opt.value == val || opt.value == Number(val))?.label
            )
            .filter(Boolean)
            .join(", ")
        }
      </Text>
      <br />
      <Text strong>性别2:</Text>
      <Text>
        {
          [{"label": "\u672a\u77e5", "value": "unknown"}, {"label": "\u7537", "value": "man"}, {"label": "\u5973", "value": "women"}].find(opt => opt.value === record?.gender2)?.label || record?.gender2
        }
      </Text>
      <br />
    </Show>
  );
};