import { Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Typography } from "antd";
import dayjs from "dayjs";

const { Text } = Typography;

export const MenuShow = () => {
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
      <Text strong>菜单标识:</Text>
      <Text>
        {
          record?.menu_label
        }
      </Text>
      <br />
      <Text strong>权限编码:</Text>
      <Text>
        {
          record?.permission_code
        }
      </Text>
      <br />
      <Text strong>图标:</Text>
      <Text>
        {
          record?.icon
        }
      </Text>
      <br />
      <Text strong>类型:</Text>
      <Text>
        {
          [{"label": "\u76ee\u5f55", "value": 0}, {"label": "\u83dc\u5355", "value": 1}, {"label": "\u6309\u94ae", "value": 2}].find(opt => opt.value === record?.type)?.label || record?.type
        }
      </Text>
      <br />
      <Text strong>排序号:</Text>
      <Text>
        {
          record?.order_by
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
      <Text strong>模块编码:</Text>
      <Text>
        {
          record?.module_code
        }
      </Text>
      <br />
    </Show>
  );
};