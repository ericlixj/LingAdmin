import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const GasTrendsList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="postcode"
          title="邮编"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="today_avg"
          title="进入平均"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="today_low"
          title="今日最低"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="trend"
          title="趋势（up, down, stable）"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="crawl_time"
          title="爬取时间"

          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};