import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const StudySessionList = () => {
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
          dataIndex="user_id"
          title="user_id"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索user_id"
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
            (filters.find((f) => f.field === "user_id")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="exam_id"
          title="exam_id"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索exam_id"
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
            (filters.find((f) => f.field === "exam_id")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="mode"
          title="学习模式"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择学习模式"

                style={{ minWidth: 150 }}
                options={ [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}] }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "mode")?.value as any[]) || null
          }

          render={(value) => {
            const option = [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="start_time"
          title="start_time"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="end_time"
          title="end_time"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="score"
          title="score"

          render={(value) => {
            return value;
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} >子表管理</ShowButton>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};