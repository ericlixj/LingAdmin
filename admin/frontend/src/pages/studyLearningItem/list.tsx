import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Button, notification, Select, Space, Spin, Table, Tag, Tooltip } from "antd";
import { useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { LoadingOutlined } from "@ant-design/icons";

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
  const [loading, setLoading] = useState(false);
  const { tableProps, filters, tableQuery } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  // 同步题库操作
  const syncQuestions = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/studyLearningItem/sync_questions');
      if (response?.data?.success) {
        notification.success({
          message: "同步成功",
          description: response.data.message || `新增 ${response.data.new_items || 0} 道题目到学习资源`,
          duration: 5,
        });
      } else {
        notification.error({
          message: "同步失败",
          description: response?.data?.message || "同步失败",
          duration: 3,
        });
      }
      // 刷新表格
      tableQuery.refetch();
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "同步失败",
        description: error.response?.data?.detail || error.message || "同步失败",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  // 同步知识点操作
  const syncKnowledge = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/studyLearningItem/sync_knowledge');
      if (response?.data?.success) {
        notification.success({
          message: "同步成功",
          description: response.data.message || `更新 ${response.data.updated_items || 0} 个，新增 ${response.data.new_items || 0} 个，删除 ${response.data.deleted_items || 0} 个知识点到学习资源`,
          duration: 5,
        });
      } else {
        notification.error({
          message: "同步失败",
          description: response?.data?.message || "同步失败",
          duration: 3,
        });
      }
      // 刷新表格
      tableQuery.refetch();
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "同步失败",
        description: error.response?.data?.detail || error.message || "同步失败",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

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
    <Spin
      spinning={loading}
      tip="同步中，请稍候..."
      indicator={antIcon}
      size="large"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: loading ? "flex" : "none",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.6)",
        zIndex: 9999,
        flexDirection: "column",
      }}
    >
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            {defaultButtons}
            <Button type="primary" onClick={syncQuestions} style={{ marginLeft: 8 }}>
              同步题库
            </Button>
            <Button type="primary" onClick={syncKnowledge} style={{ marginLeft: 8 }}>
              同步知识点
            </Button>
          </>
        )}
      >
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
    </Spin>
  );
};