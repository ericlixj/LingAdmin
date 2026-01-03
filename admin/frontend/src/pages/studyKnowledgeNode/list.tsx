import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker, Image  } from "antd";
import dayjs from "dayjs";
import { getProxyImageUrl } from "../../utils/imageProxy";

export const StudyKnowledgeNodeList = () => {
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
          dataIndex="exam_id"
          title="关联exam的id"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="code"
          title="code"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索code"
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
          dataIndex="title"
          title="标题"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索标题"
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
          dataIndex="description"
          title="描述"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="importance"
          title="importance"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择importance"

                style={{ minWidth: 150 }}
                options={ [{"label": "\u9ad8", "value": "high"}, {"label": "\u4e2d", "value": "mid"}, {"label": "\u4f4e", "value": "low"}] }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "importance")?.value as any[]) || null
          }

          render={(value) => {
            const option = [{"label": "\u9ad8", "value": "high"}, {"label": "\u4e2d", "value": "mid"}, {"label": "\u4f4e", "value": "low"}].find(opt => opt.value === value);
            return option ? option.label : value;
          }}
        />
        <Table.Column
          dataIndex="image_url"
          title="图片"
          render={(value) => {
            return value ? (
              <Image
                src={getProxyImageUrl(value)}
                alt="知识点图片"
                width={80}
                height={80}
                style={{ objectFit: "cover" }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvqVx1emZM3FeB9T4llBQV4nFictyt5PwDxepNyUV4MwHjCy0pElBsVe8dA1HfRg8I7HhCwB3IewG5QfEaInALkOgB3QL2FyBYiBkD6AqwiwG3gQ6AKhFhCfC7MQk3MQk7aHhTeBB4X3haDPCcUZBYlq3q2DxLBUktUKHpvKXpJaBYnfxGrFwM0t7cyFXJTspXUO+HYwrspjJChgOGEpVaxSYWHQKA4L1damfM9LwygU9bKwg+pX1PAcfeh4nB2BiQWHRFgMD0eEDPXcGYFjzJwPBYLWhNPjBxTrtwsFNgUFi5LbWD8UxPSlGRoY9hTgPDvYJACxK1Gu8pvAsv0jwB/yzE4Ftgf8aQ4MAbvW4Bx75jMPjKe78b28H///fHMzA/v+u499gPzfmYH5+B3n4HpD4jQH8Kvz3YW5joR8B8O9E8P8I8L//+xf4//9PzQwM/w4A8fwJ7XqjjskdY2IAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              />
            ) : (
              <span style={{ color: "#999" }}>暂无图片</span>
            );
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