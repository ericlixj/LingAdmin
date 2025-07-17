import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Space, Table } from "antd";
import dayjs from "dayjs";

export const AppNew5List = () => {
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
        <Table.Column
          dataIndex="api_base_url"
          title="开启日期"
          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />
        <Table.Column
          dataIndex="app_key"
          title="应用状态"
          render={(value) => {
            const option = [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="app_secret"
          title="开启功能"
          render={(value) => {
            if (!value) return "";
            // 可能是字符串 "1,2" 或数组
            const values = Array.isArray(value) ? value : String(value).split(",");
            const labels = values.map(v => {
              const opt = [{"label": "\u529f\u80fdA", "value": 1}, {"label": "\u529f\u80fdB", "value": 2}, {"label": "\u529f\u80fdC", "value": 3}].find(o => String(o.value) === String(v).trim());
              return opt ? opt.label : v;
            });
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="description"
          title="应用描述"
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