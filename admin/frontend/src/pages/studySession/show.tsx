import React, { useState, useMemo, useEffect } from "react";
import { Show, useTable, CreateButton, FilterDropdown } from "@refinedev/antd";
import { useShow, useDelete, useList, useMany, useGetIdentity } from "@refinedev/core";
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
  const [flashcardSyncModalVisible, setFlashcardSyncModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [flashcardSyncLoading, setFlashcardSyncLoading] = useState(false);
  const [flashcardProgressModalVisible, setFlashcardProgressModalVisible] = useState(false);
  
  // 获取当前用户信息
  const { data: currentUser } = useGetIdentity();

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

  // Flashcard 每日同步任务
  const triggerFlashcardSync = async () => {
    if (!selectedDate) {
      message.error("请选择日期");
      return;
    }

    setFlashcardSyncLoading(true);
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const response = await axiosInstance.post('/flashcardTasks/sync', null, {
        params: {
          practice_date: dateStr
        }
      });

      if (response?.data?.success) {
        notification.success({
          message: "任务已启动",
          description: response.data.message || "Flashcard 同步任务已在后台执行",
          duration: 5,
        });
        setFlashcardSyncModalVisible(false);
        // 可以刷新表格，但任务在后台执行，可能需要等待
        setTimeout(() => {
          tableQuery.refetch();
        }, 2000);
      } else {
        notification.error({
          message: "启动任务失败",
          description: response?.data?.message || "启动任务失败",
          duration: 3,
        });
      }
    } catch (error: any) {
      console.error(error);
      notification.error({
        message: "启动任务失败",
        description: error.response?.data?.detail || error.message || "启动任务失败",
        duration: 5,
      });
    } finally {
      setFlashcardSyncLoading(false);
    }
  };

  // 同步知识点操作（仅用于 FlashCard 模式）
  // 做两件事：
  // 1. 同步知识点到学习抽象对象（learning_item）
  // 2. 同步学习抽象对象中exam中knowledge类型item关联到当前session
  const syncKnowledge = async () => {
    if (!record?.exam_id) {
      message.error("无法获取考试ID");
      return;
    }
    if (!record?.id) {
      message.error("无法获取学习记录ID");
      return;
    }

    setSyncLoading(true);
    try {
      // 第一步：同步知识点到学习抽象对象（learning_item）
      const syncLearningItemResponse = await axiosInstance.post('/studyLearningItem/sync_knowledge', null, {
        params: {
          exam_id: record.exam_id
        }
      });
      
      if (!syncLearningItemResponse?.data?.success) {
        notification.error({
          message: "同步知识点到学习资源失败",
          description: syncLearningItemResponse?.data?.message || "同步失败",
          duration: 5,
        });
        return;
      }
      
      // 第二步：同步knowledge类型的learning_item到当前session
      const syncSessionItemResponse = await axiosInstance.post('/studySessionItem/sync_knowledge', null, {
        params: {
          session_id: record.id
        }
      });
      
      if (syncSessionItemResponse?.data?.success) {
        const learningItemMsg = syncLearningItemResponse.data.message || 
          `更新 ${syncLearningItemResponse.data.updated_items || 0} 个，新增 ${syncLearningItemResponse.data.new_items || 0} 个，删除 ${syncLearningItemResponse.data.deleted_items || 0} 个知识点到学习资源`;
        const sessionItemMsg = syncSessionItemResponse.data.message || 
          `新增 ${syncSessionItemResponse.data.new_items || 0} 个知识点到学习记录明细`;
        
        notification.success({
          message: "同步成功",
          description: `${learningItemMsg}；${sessionItemMsg}`,
          duration: 5,
        });
        // 刷新表格
        tableQuery.refetch();
      } else {
        notification.warning({
          message: "部分同步成功",
          description: `知识点已同步到学习资源，但同步到学习记录明细失败：${syncSessionItemResponse?.data?.message || "同步失败"}`,
          duration: 5,
        });
        // 即使第二步失败，也刷新表格，因为第一步成功了
        tableQuery.refetch();
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

  // 获取 flashcard_progress 数据（当弹窗打开时）
  // 构建过滤条件，使用学习记录的 user_id 和 exam_id
  const flashcardProgressFilters = useMemo(() => {
    const filters: any[] = [];
    // 使用学习记录的 user_id，而不是当前登录用户的 user_id
    if (record?.user_id !== null && record?.user_id !== undefined) {
      filters.push({
        field: "user_id",
        operator: "eq",
        value: Number(record.user_id), // 确保是数字类型
      });
    }
    if (record?.exam_id !== null && record?.exam_id !== undefined) {
      filters.push({
        field: "exam_id",
        operator: "eq",
        value: Number(record.exam_id), // 确保是数字类型
      });
    }
    return filters;
  }, [record?.user_id, record?.exam_id]);

  const { data: flashcardProgressData, isLoading: flashcardProgressLoading } = useList({
    resource: "flashcardProgress",
    filters: flashcardProgressFilters,
    queryOptions: {
      enabled: flashcardProgressModalVisible && 
               record?.user_id !== null && 
               record?.user_id !== undefined && 
               record?.exam_id !== null && 
               record?.exam_id !== undefined,
    },
    pagination: {
      pageSize: 100,
    },
  });

  // 调试信息（开发环境）
  useEffect(() => {
    if (flashcardProgressModalVisible) {
      console.log("Flashcard Progress Query Debug:", {
        filters: flashcardProgressFilters,
        recordUserId: record?.user_id,
        examId: record?.exam_id,
        data: flashcardProgressData,
        loading: flashcardProgressLoading,
      });
    }
  }, [flashcardProgressModalVisible, flashcardProgressFilters, record?.user_id, record?.exam_id, flashcardProgressData, flashcardProgressLoading]);

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
      tip={record?.mode && record.mode.toLowerCase() === "flashcard" ? "同步知识点中，请稍候..." : "同步题库中，请稍候..."}
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
          [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "FlashCard", "value": "flashcard"}].find(opt => opt.value === record?.mode)?.label || record?.mode
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
      {record?.mode && record.mode.toLowerCase() === "flashcard" ? (
        <>
          <Text strong>每日学习数量:</Text>
          <Text>
            {record?.daily_new_limit ? `${record.daily_new_limit} 题` : "-"}
          </Text>
          <br />
        </>
      ) : (
        <>
          <Text strong>score:</Text>
          <Text>
            {record?.score}
          </Text>
          <br />
        </>
      )}

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        学习记录明细
        <Space style={{ float: "right" }}>
          {record?.mode && record.mode.toLowerCase() === "flashcard" ? (
            <>
              <Button 
                type="default" 
                onClick={() => setFlashcardSyncModalVisible(true)}
              >
                每日同步任务
              </Button>
              <Button 
                type="default" 
                onClick={() => setFlashcardProgressModalVisible(true)}
              >
                查看学习进度
              </Button>
              <Button 
                type="primary" 
                onClick={syncKnowledge}
                loading={syncLoading}
              >
                同步知识点
              </Button>
            </>
          ) : (
            <Button 
              type="primary" 
              onClick={syncQuestions}
              loading={syncLoading}
            >
              同步题库
            </Button>
          )}
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

      {/* Flashcard 每日同步任务弹窗 */}
      <Modal
        title="Flashcard 每日同步任务"
        open={flashcardSyncModalVisible}
        onOk={triggerFlashcardSync}
        onCancel={() => {
          setFlashcardSyncModalVisible(false);
          setSelectedDate(dayjs());
        }}
        confirmLoading={flashcardSyncLoading}
        okText="执行任务"
        cancelText="取消"
        width={500}
      >
        <div style={{ padding: "20px 0" }}>
          <p style={{ marginBottom: 16 }}>
            该任务会为所有 Flashcard 类型的学习记录补充新的知识点到 flashcard_progress。
          </p>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              选择练习日期：
            </label>
            <DatePicker
              style={{ width: "100%" }}
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="YYYY-MM-DD"
              placeholder="选择日期（默认为今天）"
            />
            <p style={{ marginTop: 8, color: "#999", fontSize: 12 }}>
              提示：选择的日期将用于计算 next_review_date（练习日期 + 1天）
            </p>
          </div>
        </div>
      </Modal>

      {/* Flashcard 学习进度弹窗 */}
      <Modal
        title="Flashcard 学习进度"
        open={flashcardProgressModalVisible}
        onCancel={() => setFlashcardProgressModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setFlashcardProgressModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        <Table
          dataSource={flashcardProgressData?.data || []}
          loading={flashcardProgressLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            total: flashcardProgressData?.total || 0,
          }}
          scroll={{ x: 800 }}
        >
          <Table.Column
            dataIndex="session_item_id"
            title="Session Item ID"
            width={120}
          />
          <Table.Column
            dataIndex="interval_days"
            title="复习间隔（天）"
            width={120}
            render={(value) => value || "-"}
          />
          <Table.Column
            dataIndex="next_review_date"
            title="下次复习日期"
            width={150}
            render={(value) => {
              if (!value) return "-";
              return dayjs(value).format("YYYY-MM-DD");
            }}
          />
          <Table.Column
            dataIndex="last_rating"
            title="上次评分"
            width={100}
            render={(value) => {
              if (!value) return "-";
              const ratingMap: Record<string, { text: string; color: string }> = {
                again: { text: "重来", color: "red" },
                good: { text: "良好", color: "green" },
                easy: { text: "简单", color: "blue" },
              };
              const rating = ratingMap[value] || { text: value, color: "default" };
              return <Tag color={rating.color}>{rating.text}</Tag>;
            }}
          />
          <Table.Column
            dataIndex="state"
            title="状态"
            width={100}
            render={(value) => {
              if (!value) return "-";
              const stateMap: Record<string, { text: string; color: string }> = {
                learning: { text: "学习中", color: "orange" },
                review: { text: "复习中", color: "blue" },
              };
              const state = stateMap[value] || { text: value, color: "default" };
              return <Tag color={state.color}>{state.text}</Tag>;
            }}
          />
          <Table.Column
            dataIndex="review_count"
            title="复习次数"
            width={100}
            render={(value) => value || 0}
          />
          <Table.Column
            dataIndex="last_reviewed_at"
            title="上次复习时间"
            width={180}
            render={(value) => {
              if (!value) return "-";
              return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
            }}
          />
          <Table.Column
            dataIndex="create_time"
            title="创建时间"
            width={180}
            render={(value) => {
              if (!value) return "-";
              return dayjs(value).format("YYYY-MM-DD HH:mm:ss");
            }}
          />
        </Table>
      </Modal>
    </Show>
    </Spin>
  );
};