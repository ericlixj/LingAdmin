import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const FsaManageList = () => {
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
          dataIndex="fsa"
          title="FSA"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索FSA"
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
            (filters.find((f) => f.field === "fsa")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="delivery_center_type"
          title="类型"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索类型"
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
            (filters.find((f) => f.field === "delivery_center_type")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="city"
          title="所在城市"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索所在城市"
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
            (filters.find((f) => f.field === "city")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="province"
          title="所在省份"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索所在省份"
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
            (filters.find((f) => f.field === "province")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="delivery_center_name"
          title="投递中心名称"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="center_number"
          title="中心编号"

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