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
          dataIndex="distance"
          title="距离(km)"

          render={(value) => {
            if (value && value !== "0" && value !== "") {
              return value;
            }
            return "-";
          }}
        />
        <Table.Column
          dataIndex="crawl_time"
          title="爬取时间"
          render={(value, record) => {
            // 优先使用格式化后的时间，如果没有则使用原始时间格式化
            console.log('[DEBUG] GasPrice list render crawl_time:', { value, record, crawl_time_formatted: record?.crawl_time_formatted });
            if (record?.crawl_time_formatted) {
              return record.crawl_time_formatted;
            }
            if (value) {
              try {
                return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
              } catch (e) {
                console.error('[DEBUG] Failed to format crawl_time:', e, value);
                return String(value || "");
              }
            }
            return "";
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