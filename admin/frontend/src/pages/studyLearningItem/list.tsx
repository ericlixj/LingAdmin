import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Select, Space, Table, Tag, Tooltip } from "antd";
import { useMemo } from "react";

// 类型选项
const TYPE_OPTIONS = [
  { label: "知识点", value: "knowledge" },
  { label: "题目", value: "question" },
];

// 类型标签颜色
const TYPE_COLOR: Record<string, string> = {
  knowledge: "green",
  question: "blue",
};

export const StudyLearningItemList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  // 获取知识点列表
  const { data: knowledgeData } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 获取题目列表
  const { data: questionData } = useList({
    resource: "studyQuestion",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 构建实体映射
  const knowledgeMap = useMemo(() => {
    const map: Record<number, any> = {};
    (knowledgeData?.data || []).forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [knowledgeData]);

  const questionMap = useMemo(() => {
    const map: Record<number, any> = {};
    (questionData?.data || []).forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [questionData]);

  // 获取实体显示名称
  const getEntityName = (type: string, refId: number) => {
    if (type === "knowledge") {
      const entity = knowledgeMap[refId];
      if (entity) {
        return entity.title || `ID: ${refId}`;
      }
    } else if (type === "question") {
      const entity = questionMap[refId];
      if (entity) {
        const stem = entity.stem || "";
        // 移除图片标记
        const cleanStem = stem.replace(/\n?\[IMAGE:.*?\]/, '').trim();
        return cleanStem || `ID: ${refId}`;
      }
    }
    return `ID: ${refId}`;
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

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
            return (
              <Tag color={TYPE_COLOR[value] || "default"}>
                {option?.label || value}
              </Tag>
            );
          }}
        />

        <Table.Column
          dataIndex="ref_id"
          title="关联实体"
          render={(value, record: any) => {
            const entityName = getEntityName(record.type, value);
            return (
              <Tooltip title={`ID: ${value}`}>
                <span style={{ cursor: "help" }}>{entityName}</span>
              </Tooltip>
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