import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, InputNumber, Space, Table } from "antd";

export const ShopDailyStatList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="shop_id"
          title="店铺编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索店铺编码"
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "shop_id")?.value as string[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="year"
          title="年份"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <InputNumber
                placeholder="搜索年份"
                value={(props.selectedKeys[0] as number) || undefined}
                onChange={(value) =>
                  props.setSelectedKeys(value !== undefined ? [value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
                style={{ width: "100%" }}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "year")?.value as number[]) || null
          }
        />

        <Table.Column
          dataIndex="month"
          title="月份"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <InputNumber
                placeholder="搜索月份"
                min={1}
                max={12}
                value={(props.selectedKeys[0] as number) || undefined}
                onChange={(value) =>
                  props.setSelectedKeys(value !== undefined ? [value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
                style={{ width: "100%" }}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "month")?.value as number[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="day"
          title="日期"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <InputNumber
                placeholder="搜索日期"
                min={1}
                max={31}
                value={(props.selectedKeys[0] as number) || undefined}
                onChange={(value) =>
                  props.setSelectedKeys(value !== undefined ? [value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
                style={{ width: "100%" }}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "day")?.value as number[]) || null
          }
        />

        <Table.Column dataIndex="pv" title="PV" sorter />
        <Table.Column dataIndex="uv" title="UV" sorter />
        <Table.Column dataIndex="sales_volume" title="销量" sorter />
        <Table.Column dataIndex="sales_amount" title="销售金额" sorter />

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
