import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const DeptShow = () => {
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
      <Text strong>父ID:</Text>
      <Text>
        {
          record?.parent_id
        }
      </Text>
      <br />
      <Text strong>部门编码:</Text>
      <Text>
        {
          record?.dept_code
        }
      </Text>
      <br />
      <Text strong>部门名称:</Text>
      <Text>
        {
          record?.dept_name
        }
      </Text>
      <br />
      <Text strong>排序号:</Text>
      <Text>
        {
          record?.orderby
        }
      </Text>
      <br />
      <Text strong>负责人ID:</Text>
      <Text>
        {
          record?.leader_user_id
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
    </Show>
  );
};