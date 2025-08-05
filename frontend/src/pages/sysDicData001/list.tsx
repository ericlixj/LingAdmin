import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const SysDicData001List = () => {
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
          dataIndex="sys_dic_id"
          title="外键"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="label"
          title="字典标签"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索字典标签"
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
            (filters.find((f) => f.field === "label")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="value"
          title="字典键值"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索字典键值"
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
            (filters.find((f) => f.field === "value")?.value as any[]) || null
          }

          render={(value) => {
            return value;
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
                options={ [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}] }
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
            const option = [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="orderby"
          title="展示排序号【正序】"
          sorter

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="remark"
          title="备注"

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