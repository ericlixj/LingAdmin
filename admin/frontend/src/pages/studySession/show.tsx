import React, { useState, useMemo } from "react";
import { Show, useTable, CreateButton, FilterDropdown } from "@refinedev/antd";
import { useShow, useDelete, useList, useMany } from "@refinedev/core";
import {
  Typography,
  Divider,
  Modal,
  Table,
  Input,
  Select,
  DatePicker,
  Space,
  Button,
  Popconfirm,
  message,
  Tag,
  notification,
  Spin,
} from "antd";
import { EditOutlined, LoadingOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { StudySessionItem } from "./components/studySessionItem";
import axiosInstance from "../../utils/axiosInstance";

const { Text, Title } = Typography;

export const StudySessionShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  const { tableProps, filters, setFilters, tableQuery } = useTable({
    resource: "studySessionItem",
    syncWithLocation: false,
    pagination: { pageSize: 10 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "session_id",
          operator: "eq",
          value: record?.id,
        },
      ],
    },
    queryOptions: {
      enabled: !!record?.id,
    },
  });

  const onCreateSuccess = () => {
    setModalVisible(false);
  };

  const onEditSuccess = () => {
    setEditModalVisible(false);
    setEditRecord(null);
  };

  const deleteMutation = useDelete();
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({
        resource: "studySessionItem",
        id,
      });
      message.success("删除成功");
      tableProps.pagination?.onChange?.(
        tableProps.pagination.current,
        tableProps.pagination.pageSize
      );
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 同步题库操作
  const syncQuestions = async () => {
    if (!record?.id) {
      message.error("无法获取学习记录ID");
      return;
    }

    setSyncLoading(true);
    try {
      const response = await axiosInstance.post('/studySessionItem/sync_questions', null, {
        params: {
          session_id: record.id
        }
      });
      
      if (response?.data?.success) {
        notification.success({
          message: "同步成功",
          description: response.data.message || `新增 ${response.data.new_items || 0} 道题目到学习记录明细`,
          duration: 5,
        });
        // 刷新表格
        tableQuery.refetch();
      } else {
        notification.error({
          message: "同步失败",
          description: response?.data?.message || "同步失败",
          duration: 3,
        });
      }
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "同步失败",
        description: error.response?.data?.detail || error.message || "同步失败",
        duration: 5,
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // 获取学习项目列表
  const allItems = tableProps?.dataSource || [];
  const learningItemIds = [...new Set(allItems.map((item: any) => item.learning_item_id).filter(Boolean))];
  
  const { data: learningItemsData } = useMany({
    resource: "studyLearningItem",
    ids: learningItemIds as number[],
    queryOptions: {
      enabled: learningItemIds.length > 0,
    },
  });

  // 收集所有关联的实体ID
  const learningItems = learningItemsData?.data || [];
  const knowledgeIds = learningItems
    .filter((item: any) => item.type === "knowledge")
    .map((item: any) => item.ref_id)
    .filter(Boolean);
  const questionIds = learningItems
    .filter((item: any) => item.type === "question")
    .map((item: any) => item.ref_id)
    .filter(Boolean);

  // 批量获取知识点
  const { data: knowledgeData } = useMany({
    resource: "studyKnowledgeNode",
    ids: knowledgeIds as number[],
    queryOptions: {
      enabled: knowledgeIds.length > 0,
    },
  });

  // 批量获取题目
  const { data: questionData } = useMany({
    resource: "studyQuestion",
    ids: questionIds as number[],
    queryOptions: {
      enabled: questionIds.length > 0,
    },
  });

  // 构建映射
  const learningItemMap = useMemo(() => {
    const map = new Map();
    learningItems.forEach((item: any) => {
      map.set(item.id, item);
    });
    return map;
  }, [learningItems]);

  const knowledgeMap = useMemo(() => {
    const map = new Map();
    (knowledgeData?.data || []).forEach((kn: any) => {
      map.set(kn.id, kn);
    });
    return map;
  }, [knowledgeData]);

  const questionMap = useMemo(() => {
    const map = new Map();
    (questionData?.data || []).forEach((q: any) => {
      map.set(q.id, q);
    });
    return map;
  }, [questionData]);

  // 获取学习内容显示文本
  const getLearningItemLabel = (learningItemId: number) => {
    const item = learningItemMap.get(learningItemId);
    if (!item) return `ID: ${learningItemId}`;
    
    if (item.type === "knowledge") {
      const kn = knowledgeMap.get(item.ref_id);
      return kn ? kn.title : `知识点 #${item.ref_id}`;
    } else if (item.type === "question") {
      const q = questionMap.get(item.ref_id);
      if (q) {
        const stem = q.stem || "";
        const cleanStem = stem.replace(/\n?\[IMAGE:.*?\]/, '').trim();
        return cleanStem.length > 50 ? cleanStem.substring(0, 50) + "..." : cleanStem;
      }
      return `题目 #${item.ref_id}`;
    }
    return `ID: ${learningItemId}`;
  };

  return (
    <Spin
      spinning={syncLoading}
      tip="同步题库中，请稍候..."
      indicator={antIcon}
      size="large"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        display: syncLoading ? "flex" : "none",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.6)",
        zIndex: 9999,
        flexDirection: "column",
      }}
    >
      <Show isLoading={isLoading}>
      {/* 主表字段渲染 */}
      <Text strong>user_id:</Text>
      <Text>
        {
          record?.user_id
        }
      </Text>
      <br />
      <Text strong>exam_id:</Text>
      <Text>
        {
          record?.exam_id
        }
      </Text>
      <br />
      <Text strong>学习模式:</Text>
      <Text>
        {
          [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}].find(opt => opt.value === record?.mode)?.label || record?.mode
        }
      </Text>
      <br />
      {record?.mode === "exam" && (
        <>
          <Text strong>考试时长（分钟）:</Text>
          <Text>
            {
              record?.exam_duration ? `${record.exam_duration} 分钟` : "-"
            }
          </Text>
          <br />
          <Text strong>考试题目数量:</Text>
          <Text>
            {
              record?.question_count ? `${record.question_count} 题` : "-"
            }
          </Text>
          <br />
        </>
      )}
      <Text strong>score:</Text>
      <Text>
        {
          record?.score
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        学习记录明细
        <Space style={{ float: "right" }}>
          <Button 
            type="primary" 
            onClick={syncQuestions}
            loading={syncLoading}
          >
            同步题库
          </Button>
          <CreateButton onClick={() => setModalVisible(true)}>
            新增学习记录明细
          </CreateButton>
        </Space>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>
        <Table.Column
          dataIndex="learning_item_id"
          title="学习内容"
          render={(value) => getLearningItemLabel(value)}
        />
        <Table.Column
          dataIndex="is_correct"
          title="是否正确"
          render={(value) => {
            const isCorrect = value === 1 || value === true;
            return (
              <Tag color={isCorrect ? "success" : "default"}>
                {isCorrect ? "是" : "否"}
              </Tag>
            );
          }}
        />
        <Table.Column
          dataIndex="response"
          title="用户做答内容"
          render={(value) => value || "-"}
        />
        <Table.Column
          dataIndex="time_spent_second"
          title="耗时(秒)"
          render={(value) => value || "-"}
        />

        {/* 操作列 */}
        <Table.Column
          title="操作"
          key="actions"
          render={(_, record) => (
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditRecord(record);
                  setEditModalVisible(true);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除此项吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      {/* 新增弹窗 */}
      <Modal
        title="新增学习记录明细"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <StudySessionItem
            session_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑学习记录明细"
        open={editModalVisible}
        footer={null}
        onCancel={() => {
          setEditModalVisible(false);
          setEditRecord(null);
        }}
        destroyOnClose
        width={600}
      >
        {record?.id && editRecord && (
          <StudySessionItem
            session_id={Number(record.id)}
            initialValues={editRecord}
            isEdit={true}
            onSuccess={onEditSuccess}
            onCancel={() => {
              setEditModalVisible(false);
              setEditRecord(null);
            }}
          />
        )}
      </Modal>
    </Show>
    </Spin>
  );
};