import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Space, Table } from "antd";

export const PermissionList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="code"
          title="权限编码"
          sorter 
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search code"
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
        <Table.Column
          dataIndex="name"
          title="权限名称"
          sorter 
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search code"
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
          dataIndex="description"
          title="权限描述"
        />                
        <Table.Column dataIndex="create_time" title="创建时间" />
        <Table.Column
          title="Actions"
          render={(_, record) => (
            <Space>
              <EditButton
                recordItemId={record.id}
                disabled={record.id==1}
              />
              <ShowButton recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
