import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Input, Select, Space, Table, Tag, Tooltip } from "antd";
import { PictureOutlined } from "@ant-design/icons";
import { useMemo } from "react";

// 状态选项
const STATUS_OPTIONS = [
  { label: "开启", value: 1 },
  { label: "关闭", value: 0 },
];

// 题目类型选项
const TYPE_OPTIONS = [
  { label: "单选题", value: "single" },
  { label: "多选题", value: "multi" },
  { label: "判断题", value: "judge" },
];

export const StudyQuestionList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 获取考试列表
  const { data: examData } = useList({
    resource: "studyExam",
    pagination: { pageSize: 100 },
  });

  // 创建考试 ID -> 名称的映射
  const examMap = useMemo(() => {
    const map: Record<number, string> = {};
    examData?.data?.forEach((exam: any) => {
      map[exam.id] = exam.name;
    });
    return map;
  }, [examData]);

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="exam_id"
          title="考试"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                placeholder="选择考试"
                style={{ width: 200 }}
                options={examData?.data?.map((exam: any) => ({
                  label: exam.name,
                  value: exam.id,
                }))}
                value={props.selectedKeys[0]}
                onChange={(value) => props.setSelectedKeys(value ? [value] : [])}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "exam_id")?.value as any[]) || null
          }
          render={(value) => examMap[value] || value}
        />

        <Table.Column
          dataIndex="type"
          title="类型"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                placeholder="选择类型"
                style={{ width: 150 }}
                options={TYPE_OPTIONS}
                value={props.selectedKeys[0]}
                onChange={(value) => props.setSelectedKeys(value ? [value] : [])}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "type")?.value as any[]) || null
          }
          render={(value) => {
            const option = TYPE_OPTIONS.find((opt) => opt.value === value);
            const colorMap: Record<string, string> = {
              single: "blue",
              multi: "purple",
              judge: "orange",
            };
            return option ? (
              <Tag color={colorMap[value]}>{option.label}</Tag>
            ) : (
              value
            );
          }}
        />

        <Table.Column
          dataIndex="stem"
          title="题干"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索题干"
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
            (filters.find((f) => f.field === "stem")?.value as any[]) || null
          }
          render={(value, record: any) => {
            if (!value) return value;
            // 检查是否有图片（使用 image_url 字段）
            const hasImage = record?.image_url ? true : false;
            // 题干文本（不再需要移除图片标记）
            const cleanText = value;
            // 截断显示
            const displayText = cleanText.length > 50 ? cleanText.substring(0, 50) + "..." : cleanText;
            return (
              <Space>
                {hasImage && (
                  <Tooltip title="包含图片">
                    <PictureOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                )}
                <span>{displayText}</span>
              </Space>
            );
          }}
        />

        <Table.Column
          dataIndex="status"
          title="状态"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                placeholder="选择状态"
                style={{ width: 120 }}
                options={STATUS_OPTIONS}
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value !== undefined ? [value] : [])
                }
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "status")?.value as any[]) || null
          }
          render={(value) => {
            const option = STATUS_OPTIONS.find((opt) => opt.value === value);
            return option ? (
              <Tag color={value === 1 ? "success" : "default"}>{option.label}</Tag>
            ) : (
              value
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
