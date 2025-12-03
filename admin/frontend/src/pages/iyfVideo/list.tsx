import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker  } from "antd";
import dayjs from "dayjs";

export const IyfVideoList = () => {
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
          dataIndex="iyf_id"
          title="IYF 平台 ID"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="title"
          title="名称"
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
            (filters.find((f) => f.field === "title")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="cover_url"
          title="封面图片"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="description"
          title="简介"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="category"
          title="类型"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="year"
          title="年份"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="region"
          title="地区"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="rating"
          title="评分"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="view_count"
          title="播放量"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="crawl_date"
          title="爬取时间"

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