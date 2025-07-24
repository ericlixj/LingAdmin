import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const DemoUserList = () => {
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
          title="用户名"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索用户名"
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
          dataIndex="age"
          title="年龄"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索年龄"
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
            (filters.find((f) => f.field === "age")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="gender"
          title="性别"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择性别"

                style={{ minWidth: 150 }}
                options={ [{"label": "\u672a\u77e5", "value": 0}, {"label": "\u7537", "value": 1}, {"label": "\u5973", "value": 2}] }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "gender")?.value as any[]) || null
          }

          render={(value) => {
            const option = [{"label": "\u672a\u77e5", "value": 0}, {"label": "\u7537", "value": 1}, {"label": "\u5973", "value": 2}].find(opt => opt.value === value);
            return option ? option.label : value;
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
          dataIndex="birth_day"
          title="生日"
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
            (filters.find((f) => f.field === "birth_day")?.value as any[]) || null
          }

          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />
        <Table.Column
          dataIndex="hobby2"
          title="爱好2"

          render={(value) => {
            if (!value) return "";
            const values = Array.isArray(value) ? value : String(value).split(",");
            const labels = values.map(v => {
              const opt = [{"label": "\u9605\u8bfb", "value": 1}, {"label": "\u65c5\u884c", "value": 2}, {"label": "\u97f3\u4e50", "value": 3}, {"label": "\u8fd0\u52a8", "value": 4}, {"label": "\u6444\u5f71", "value": 5}, {"label": "\u7ed8\u753b", "value": 6}, {"label": "\u70f9\u996a", "value": 7}, {"label": "\u7535\u5f71", "value": 8}, {"label": "\u6e38\u620f", "value": 9}, {"label": "\u5199\u4f5c", "value": 10}].find(o => String(o.value) === String(v).trim());
              return opt ? opt.label : v;
            });
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="hobby"
          title="爱好"

          render={(value) => {
            if (!value) return "";
            const values = Array.isArray(value) ? value : String(value).split(",");
            const labels = values.map(v => {
              const opt = [{"label": "\u9605\u8bfb", "value": "reading"}, {"label": "\u65c5\u884c", "value": "travel"}, {"label": "\u97f3\u4e50", "value": "music"}, {"label": "\u8fd0\u52a8", "value": "sports"}, {"label": "\u6444\u5f71", "value": "photography"}, {"label": "\u7ed8\u753b", "value": "painting"}, {"label": "\u70f9\u996a", "value": "cooking"}, {"label": "\u7535\u5f71", "value": "movies"}, {"label": "\u6e38\u620f", "value": "gaming"}, {"label": "\u5199\u4f5c", "value": "writing"}].find(o => String(o.value) === String(v).trim());
              return opt ? opt.label : v;
            });
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="gender2"
          title="性别2"

          render={(value) => {
            const option = [{"label": "\u672a\u77e5", "value": "unknown"}, {"label": "\u7537", "value": "man"}, {"label": "\u5973", "value": "women"}].find(opt => opt.value === value);
            return option ? option.label : value;
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