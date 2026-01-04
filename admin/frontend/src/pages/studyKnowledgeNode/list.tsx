import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker, Image  } from "antd";
import dayjs from "dayjs";
import { useList } from "@refinedev/core";
import { useMemo } from "react";
import { getProxyImageUrl } from "../../utils/imageProxy";

export const StudyKnowledgeNodeList = () => {
  const { tableProps, filters, setFilters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 调试：打印过滤条件
  console.log("Current filters:", filters);

  // 获取考试列表
  const { data: examsData, isLoading: examsLoading } = useList({
    resource: "studyExam",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 创建 exam_id 到 exam 名称的映射
  const examIdToNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (examsData?.data || []).forEach((exam: any) => {
      map.set(exam.id, exam.name || `ID: ${exam.id}`);
    });
    return map;
  }, [examsData?.data]);

  // 考试选项（用于过滤）
  const examOptions = useMemo(() => {
    return (examsData?.data || []).map((exam: any) => ({
      label: exam.name || `ID: ${exam.id}`,
      value: exam.id,
    }));
  }, [examsData?.data]);

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="exam_id"
          title="关联exam"
          filterDropdown={(props) => {
            // 获取当前选中的值
            const selectedValue = props.selectedKeys?.[0];
            
            // 转换为数字类型，确保与 examOptions 中的 value 类型一致
            let numericValue: number | undefined = undefined;
            if (selectedValue !== null && selectedValue !== undefined) {
              if (typeof selectedValue === 'number') {
                numericValue = selectedValue;
              } else if (typeof selectedValue === 'string') {
                const parsed = Number(selectedValue);
                numericValue = isNaN(parsed) ? undefined : parsed;
              }
            }
            
            // 检查值是否在选项中存在
            const matchingOption = examOptions.find(opt => opt.value === numericValue);
            const valueExists = !examsLoading && numericValue !== undefined && matchingOption !== undefined;
            
            // 调试日志
            console.log("FilterDropdown Debug:", {
              selectedValue,
              numericValue,
              valueExists,
              matchingOption,
              examOptionsLength: examOptions.length,
              examOptionsSample: examOptions.slice(0, 3),
            });
            
            // 如果值存在，使用该值；否则设为 undefined（这样 Select 会显示 placeholder 而不是原始值）
            const displayValue = valueExists ? numericValue : undefined;
            
            return (
              <FilterDropdown {...props}>
                <Select
                  allowClear
                  showSearch
                  placeholder="请选择考试"
                  style={{ minWidth: 200 }}
                  options={examOptions}
                  value={displayValue}
                  loading={examsLoading}
                  onChange={(value) => {
                    // 只设置选中的值，不自动确认查询
                    props.setSelectedKeys(value !== null && value !== undefined ? [value] : []);
                  }}
                  filterOption={(input, option) => {
                    const label = typeof option?.label === 'string' ? option.label : String(option?.label || '');
                    return label.toLowerCase().includes(input.toLowerCase());
                  }}
                  optionFilterProp="label"
                />
              </FilterDropdown>
            );
          }}
          filteredValue={
            (filters.find((f: any) => f.field === "exam_id")?.value as any[]) || null
          }       
          render={(value) => {
            return examIdToNameMap.get(value) || value || "-";
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
            (filters.find((f: any) => f.field === "code")?.value as any[]) || null
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
            (filters.find((f: any) => f.field === "title")?.value as any[]) || null
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
            (filters.find((f: any) => f.field === "importance")?.value as any[]) || null
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