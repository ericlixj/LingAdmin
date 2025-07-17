import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Space, Table } from "antd";

export const AppNew3List = () => {
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
          dataIndex="name"
          title="应用名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索应用名称"
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
            (filters.find((f) => f.field === "name")?.value as string[]) || null
          }
        />
        <Table.Column
          dataIndex="code"
          title="应用编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索应用编码"
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
            (filters.find((f) => f.field === "code")?.value as string[]) || null
          }
        />
        <Table.Column dataIndex="api_base_url" title="API基础URL" />
        <Table.Column dataIndex="app_key" title="对接平台的 App Key" />
        <Table.Column dataIndex="app_secret" title="对接平台的 App Secret" />
        <Table.Column dataIndex="description" title="应用描述" />

        <Table.Column title="操作" render={(_, record) => (
          <Space>
            <EditButton recordItemId={record.id} />
            <ShowButton recordItemId={record.id} />
          </Space>
        )} />
      </Table>
    </List>
  );
};