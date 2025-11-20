import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const GasPriceList = () => {
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
          dataIndex="station_id"
          title="加油站主键"

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
          dataIndex="fuel_product"
          title="油品"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="cash_price"
          title="现金价格"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="cash_formatted_price"
          title="格式化现金价格"

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