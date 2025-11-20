import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const UserPostcodeList = () => {
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
          dataIndex="user_id"
          title="用户ID"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="postcode"
          title="邮编"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="label"
          title="标识"

          render={(value) => {
            return value;
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