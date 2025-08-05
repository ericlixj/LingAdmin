import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const SysDicData001Show = () => {
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
      <Text strong>外键:</Text>
      <Text>
        {
          record?.sys_dic_id
        }
      </Text>
      <br />
      <Text strong>字典标签:</Text>
      <Text>
        {
          record?.label
        }
      </Text>
      <br />
      <Text strong>字典键值:</Text>
      <Text>
        {
          record?.value
        }
      </Text>
      <br />
      <Text strong>状态:</Text>
      <Text>
        {
          [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}].find(opt => opt.value === record?.status)?.label || record?.status
        }
      </Text>
      <br />
      <Text strong>展示排序号【正序】:</Text>
      <Text>
        {
          record?.orderby
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
    </Show>
  );
};