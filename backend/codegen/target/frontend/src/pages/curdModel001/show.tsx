import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const CurdModel001Show = () => {
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
      <Text strong>名称:</Text>
      <Text>
        {
          record?.name
        }
      </Text>
      <br />
      <Text strong>编码:</Text>
      <Text>
        {
          record?.code
        }
      </Text>
      <br />
      <Text strong>开启日期:</Text>
      <Text>
        {
          record?.open_time ? dayjs(record.open_time).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
      <Text strong>状态:</Text>
      <Text>
        {
          [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}].find(opt => opt.value === record?.status)?.label || record?.status
        }
      </Text>
      <br />
      <Text strong>开启功能:</Text>
      <Text>
        {
          (record?.open_function || "")
            .split(",")
            .map(val =>
              [{"label": "\u529f\u80fdA", "value": 1}, {"label": "\u529f\u80fdB", "value": 2}, {"label": "\u529f\u80fdC", "value": 3}].find(opt => opt.value == val || opt.value == Number(val))?.label
            )
            .filter(Boolean)
            .join(", ")
        }
      </Text>
      <br />
      <Text strong>应用描述:</Text>
      <Text>
        {
          record?.description
        }
      </Text>
      <br />
    </Show>
  );
};