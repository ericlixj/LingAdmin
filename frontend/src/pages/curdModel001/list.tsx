import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const CurdModel001List = () => {
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
          title="名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索名称"
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
            (filters.find((f) => f.field === "name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="code"
          title="编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索编码"
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
            (filters.find((f) => f.field === "code")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="open_time"
          title="开启日期"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <DatePicker.RangePicker

                style={{ width: '100%' }}
                value={props.selectedKeys[0]}
                onChange={(dates) => {
                  props.setSelectedKeys(dates ? [dates] : []);
                }}
                onOk={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "open_time")?.value as any[]) || null
          }

          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />
        <Table.Column
          dataIndex="status"
          title="状态"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择状态"

                style={{ minWidth: 150 }}
                options={ [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}] }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "status")?.value as any[]) || null
          }

          render={(value) => {
            const option = [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="open_function"
          title="开启功能"

          render={(value) => {
            if (!value) return "";
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