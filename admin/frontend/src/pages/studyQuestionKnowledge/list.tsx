import { useState, useMemo, useEffect } from "react";
import {
  List,
  useTable,
} from "@refinedev/antd";
import { useMany, useList, useCustomMutation, useInvalidate, useCustom } from "@refinedev/core";
import { Space, Table, Tag, Modal, Card, Typography, Tooltip, Button, Select, message, Spin, Divider, InputNumber, Empty } from "antd";
import { QuestionCircleOutlined, BookOutlined, CheckCircleOutlined, EditOutlined, FileTextOutlined, EnvironmentOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Text, Paragraph, Title } = Typography;

// 重要性颜色
const IMPORTANCE_COLOR: Record<string, string> = {
  high: "red",
  medium: "orange",
  low: "blue",
};

// 题目类型
const TYPE_MAP: Record<string, { label: string; color: string }> = {
  single: { label: "单选", color: "blue" },
  multi: { label: "多选", color: "purple" },
  judge: { label: "判断", color: "orange" },
};

// 来源类型图标
const SOURCE_TYPE_ICON: Record<string, string> = {
  pdf: "📄",
  book: "📚",
  video: "🎬",
  web: "🌐",
};

// 解析选项 - 支持对象格式 {"A": "...", "B": "..."} 和数组格式
const parseOptions = (optionsStr: string) => {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    const labels = ["A", "B", "C", "D", "E", "F"];
    
    // 对象格式: {"A": "选项A", "B": "选项B", ...}
    if (typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        label: key,
        value: String(value),
      }));
    }
    
    // 数组格式
    if (Array.isArray(parsed)) {
      return parsed.map((item: any, index: number) => {
        if (typeof item === "string") {
          return { label: labels[index] || String(index + 1), value: item };
        }
        if (typeof item === "object" && item !== null) {
          return {
            label: item.label || labels[index] || String(index + 1),
            value: item.value || item.text || "",
          };
        }
        return { label: labels[index] || String(index + 1), value: String(item) };
      });
    }
    return [];
  } catch {
    return [];
  }
};

// 解析答案
const parseAnswer = (answerStr: string): string[] => {
  if (!answerStr) return [];
  try {
    const parsed = JSON.parse(answerStr);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return [answerStr];
  }
};

// 分组后的数据类型
interface GroupedData {
  question_id: number;
  links: Array<{
    id: number;
    knowledge_node_id: number;
    weight: number;
  }>;
}

// 编辑中的关联项
interface EditingLink {
  knowledge_node_id: number;
  weight: number;
}

export const StudyQuestionKnowledgeList = () => {
  const invalidate = useInvalidate();
  
  const { tableProps, tableQueryResult } = useTable({
    syncWithLocation: true,
    pagination: {
      pageSize: 500, // 获取更多数据以便分组
    },
  });

  // 收集所有 question_id 和 knowledge_node_id
  const allLinks = tableProps?.dataSource || [];
  const questionIds = [...new Set(allLinks.map((item: any) => item.question_id).filter(Boolean))];
  const knowledgeIds = [...new Set(allLinks.map((item: any) => item.knowledge_node_id).filter(Boolean))];

  // 批量获取题目信息
  const { data: questionsData, isLoading: questionsLoading } = useMany({
    resource: "studyQuestion",
    ids: questionIds as number[],
    queryOptions: {
      enabled: questionIds.length > 0,
    },
  });

  // 批量获取知识点信息
  const { data: knowledgeData, isLoading: knowledgeLoading } = useMany({
    resource: "studyKnowledgeNode",
    ids: knowledgeIds as number[],
    queryOptions: {
      enabled: knowledgeIds.length > 0,
    },
  });

  // 构建映射
  const questionsMap = new Map(
    questionsData?.data?.map((q: any) => [q.id, q]) || []
  );
  const knowledgeMap = new Map(
    knowledgeData?.data?.map((k: any) => [k.id, k]) || []
  );

  // 按 question_id 分组数据
  const groupedData = useMemo(() => {
    const groups = new Map<number, GroupedData>();
    
    allLinks.forEach((link: any) => {
      const qId = link.question_id;
      if (!qId) return;
      
      if (!groups.has(qId)) {
        groups.set(qId, {
          question_id: qId,
          links: [],
        });
      }
      
      groups.get(qId)!.links.push({
        id: link.id,
        knowledge_node_id: link.knowledge_node_id,
        weight: link.weight,
      });
    });
    
    // 转换为数组并按 question_id 排序
    return Array.from(groups.values()).sort((a, b) => a.question_id - b.question_id);
  }, [allLinks]);

  // 弹窗状态
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [editingLinks, setEditingLinks] = useState<EditingLink[]>([]);
  const [saving, setSaving] = useState(false);

  // 获取选中知识点的来源信息
  const { data: knowledgeSourcesData, isLoading: sourcesLoading } = useCustom({
    url: `studyKnowledgeNode/${selectedKnowledge?.id}/sources`,
    method: "get",
    queryOptions: {
      enabled: knowledgeModalVisible && !!selectedKnowledge?.id,
    },
  });

  // 获取所有知识点列表（用于编辑时选择）
  const { data: allKnowledgeData, isLoading: allKnowledgeLoading } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 500 },
    filters: editingQuestion?.exam_id 
      ? [{ field: "exam_id", operator: "eq", value: editingQuestion.exam_id }] 
      : [],
    queryOptions: {
      enabled: editModalVisible && !!editingQuestion,
    },
  });

  // 更新关联的 mutation
  const { mutate: updateKnowledge } = useCustomMutation();

  const showQuestionDetail = (question: any) => {
    setSelectedQuestion(question);
    setQuestionModalVisible(true);
  };

  const showKnowledgeDetail = (knowledge: any) => {
    setSelectedKnowledge(knowledge);
    setKnowledgeModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: GroupedData) => {
    const question = questionsMap.get(record.question_id);
    setEditingQuestion(question);
    // 初始化编辑中的关联列表（带权重）
    setEditingLinks(record.links.map(l => ({
      knowledge_node_id: l.knowledge_node_id,
      weight: l.weight || 50,
    })));
    setEditModalVisible(true);
  };

  // 添加知识点
  const handleAddKnowledge = (knowledgeId: number) => {
    if (editingLinks.some(l => l.knowledge_node_id === knowledgeId)) {
      message.warning("该知识点已添加");
      return;
    }
    setEditingLinks([...editingLinks, { knowledge_node_id: knowledgeId, weight: 50 }]);
  };

  // 删除知识点
  const handleRemoveKnowledge = (knowledgeId: number) => {
    setEditingLinks(editingLinks.filter(l => l.knowledge_node_id !== knowledgeId));
  };

  // 更新权重
  const handleUpdateWeight = (knowledgeId: number, weight: number) => {
    setEditingLinks(editingLinks.map(l => 
      l.knowledge_node_id === knowledgeId ? { ...l, weight } : l
    ));
  };

  // 保存编辑
  const handleSave = () => {
    if (!editingQuestion) return;
    
    setSaving(true);
    updateKnowledge(
      {
        url: `studyQuestion/${editingQuestion.id}/knowledge`,
        method: "put",
        values: {
          links: editingLinks,
        },
        config: {
          data: {
            links: editingLinks,
          },
        },
      },
      {
        onSuccess: () => {
          message.success("关联已更新");
          setEditModalVisible(false);
          setSaving(false);
          // 刷新列表
          invalidate({
            resource: "studyQuestionKnowledge",
            invalidates: ["list"],
          });
          tableQueryResult.refetch();
        },
        onError: () => {
          message.error("更新失败");
          setSaving(false);
        },
      }
    );
  };

  // 知识点选项（排除已选的）
  const availableKnowledgeOptions = (allKnowledgeData?.data || [])
    .filter((k: any) => !editingLinks.some(l => l.knowledge_node_id === k.id))
    .map((k: any) => ({
      label: (
        <Space>
          <Tag color={IMPORTANCE_COLOR[k.importance] || "default"} style={{ marginRight: 4 }}>
            {k.code}
          </Tag>
          <span>{k.title.slice(0, 50)}{k.title.length > 50 ? "..." : ""}</span>
        </Space>
      ),
      value: k.id,
      searchText: `${k.code} ${k.title}`,
    }));

  // 知识点来源数据
  const knowledgeSources = knowledgeSourcesData?.data?.sources || [];

  // 获取知识点信息（用于编辑弹窗）
  const getKnowledgeInfo = (knowledgeId: number) => {
    return allKnowledgeData?.data?.find((k: any) => k.id === knowledgeId) || 
           knowledgeMap.get(knowledgeId);
  };

  return (
    <>
      <List
        headerButtons={({ defaultButtons }) => (
          <>
            {defaultButtons}
          </>
        )}
      >
        <Table
          dataSource={groupedData}
          rowKey="question_id"
          loading={tableProps.loading || questionsLoading || knowledgeLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 道题目有关联`,
          }}
        >
          <Table.Column
            dataIndex="question_id"
            title="题目"
            width={400}
            render={(value) => {
              const question = questionsMap.get(value);
              if (!question) {
                return <Text type="secondary">#{value}</Text>;
              }
              const typeInfo = TYPE_MAP[question.type] || { label: question.type, color: "default" };
              return (
                <Tooltip title="点击查看题目详情">
                  <div
                    style={{ cursor: "pointer" }}
                    onClick={() => showQuestionDetail(question)}
                  >
                    <Space>
                      <QuestionCircleOutlined style={{ color: "#1890ff" }} />
                      <Tag color={typeInfo.color} style={{ marginRight: 0 }}>
                        {typeInfo.label}
                      </Tag>
                      <Text type="secondary">#{question.id}</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Text ellipsis style={{ maxWidth: 350, display: "inline-block" }}>
                        {question.stem}
                      </Text>
                    </div>
                  </div>
                </Tooltip>
              );
            }}
          />

          <Table.Column
            dataIndex="links"
            title="关联知识点"
            render={(links: GroupedData["links"]) => {
              if (!links || links.length === 0) {
                return <Text type="secondary">无关联</Text>;
              }
              return (
                <Space wrap size={[4, 8]}>
                  {links.map((link) => {
                    const knowledge = knowledgeMap.get(link.knowledge_node_id);
                    if (!knowledge) {
                      return (
                        <Tag key={link.id} color="default">
                          #{link.knowledge_node_id}
                        </Tag>
                      );
                    }
                    return (
                      <Tooltip
                        key={link.id}
                        title={
                          <div>
                            <div><strong>{knowledge.title}</strong></div>
                            <div>权重: {link.weight}%</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>点击查看详情</div>
                          </div>
                        }
                      >
                        <Tag
                          color={IMPORTANCE_COLOR[knowledge.importance] || "default"}
                          style={{ cursor: "pointer", marginBottom: 0 }}
                          onClick={() => showKnowledgeDetail(knowledge)}
                        >
                          <BookOutlined style={{ marginRight: 4 }} />
                          {knowledge.title}
                          <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>
                            ({link.weight}%)
                          </span>
                        </Tag>
                      </Tooltip>
                    );
                  })}
                </Space>
              );
            }}
          />

          <Table.Column
            dataIndex="links"
            title="数量"
            width={80}
            render={(links: GroupedData["links"]) => (
              <Tag color="blue">{links?.length || 0} 个</Tag>
            )}
          />

          <Table.Column
            title="操作"
            width={100}
            render={(_, record: GroupedData) => (
              <Space>
                <Tooltip title="编辑关联">
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                </Tooltip>
              </Space>
            )}
          />
        </Table>
      </List>

      {/* 题目详情弹窗 */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>题目详情</span>
            {selectedQuestion && (
              <Tag color="blue">#{selectedQuestion.id}</Tag>
            )}
          </Space>
        }
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedQuestion && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                <Tag color={TYPE_MAP[selectedQuestion.type]?.color || "default"}>
                  {TYPE_MAP[selectedQuestion.type]?.label || selectedQuestion.type}
                </Tag>
                <Tag color={selectedQuestion.status === 1 ? "success" : "default"}>
                  {selectedQuestion.status === 1 ? "开启" : "关闭"}
                </Tag>
              </Space>
              <Title level={5} style={{ marginTop: 0 }}>
                {selectedQuestion.stem}
              </Title>

              {/* 选项 */}
              <div style={{ marginTop: 16 }}>
                {parseOptions(selectedQuestion.options).map((opt: any, idx: number) => {
                  const answers = parseAnswer(selectedQuestion.answer);
                  const isCorrect = answers.includes(opt.label) || answers.includes(opt.label.toLowerCase());
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        marginBottom: 6,
                        borderRadius: 6,
                        border: isCorrect ? "2px solid #52c41a" : "1px solid #d9d9d9",
                        backgroundColor: isCorrect ? "#f6ffed" : "#fff",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Tag color={isCorrect ? "success" : "default"} style={{ marginRight: 8 }}>
                        {opt.label}
                      </Tag>
                      <span style={{ flex: 1 }}>{opt.value}</span>
                      {isCorrect && <CheckCircleOutlined style={{ color: "#52c41a" }} />}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* 解释 */}
            {(selectedQuestion.explanation_raw || selectedQuestion.explanation_human) && (
              <Card size="small" title="📖 解析">
                {selectedQuestion.explanation_raw && (
                  <Paragraph style={{ marginBottom: selectedQuestion.explanation_human ? 12 : 0 }}>
                    <Text strong>官方解释：</Text> {selectedQuestion.explanation_raw}
                  </Paragraph>
                )}
                {selectedQuestion.explanation_human && (
                  <Paragraph style={{ marginBottom: 0 }}>
                    <Text strong>通俗解释：</Text> {selectedQuestion.explanation_human}
                  </Paragraph>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* 知识点详情弹窗 */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            <span>知识点详情</span>
            {selectedKnowledge && (
              <Tag color={IMPORTANCE_COLOR[selectedKnowledge.importance] || "default"}>
                {selectedKnowledge.code}
              </Tag>
            )}
          </Space>
        }
        open={knowledgeModalVisible}
        onCancel={() => setKnowledgeModalVisible(false)}
        footer={null}
        width={650}
      >
        {selectedKnowledge && (
          <div>
            {/* 基本信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                <Tag color={IMPORTANCE_COLOR[selectedKnowledge.importance] || "default"}>
                  重要性: {selectedKnowledge.importance}
                </Tag>
                <Text type="secondary">ID: #{selectedKnowledge.id}</Text>
              </Space>
              <Title level={5} style={{ marginTop: 0 }}>
                {selectedKnowledge.title}
              </Title>
              {selectedKnowledge.description && (
                <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                  {selectedKnowledge.description}
                </Paragraph>
              )}
            </Card>

            {/* 来源信息 */}
            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  <span>来源信息</span>
                  <Tag color="cyan">{knowledgeSources.length} 个来源</Tag>
                </Space>
              }
            >
              {sourcesLoading ? (
                <Spin size="small" />
              ) : knowledgeSources.length > 0 ? (
                <div>
                  {knowledgeSources.map((source: any, index: number) => (
                    <div key={source.section_id}>
                      {index > 0 && <Divider style={{ margin: "12px 0" }} />}
                      
                      {/* 教材信息 */}
                      {source.source && (
                        <div style={{ marginBottom: 8 }}>
                          <Space>
                            <span>{SOURCE_TYPE_ICON[source.source.type] || "📄"}</span>
                            <Text strong>{source.source.title}</Text>
                            {source.source.version && (
                              <Tag color="default" style={{ fontSize: 11 }}>
                                v{source.source.version}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      )}
                      
                      {/* 章节信息 */}
                      <div style={{ marginBottom: 8, paddingLeft: 20 }}>
                        <Space>
                          <EnvironmentOutlined style={{ color: "#1890ff" }} />
                          <Text>
                            {source.chapter}
                            {source.section && ` › ${source.section}`}
                          </Text>
                        </Space>
                      </div>
                      
                      {/* 页码 */}
                      {(source.page_start || source.page_end) && (
                        <div style={{ paddingLeft: 20, marginBottom: 8 }}>
                          <Tag color="blue">
                            页码: {source.page_start}
                            {source.page_end && source.page_end !== source.page_start && ` - ${source.page_end}`}
                          </Tag>
                        </div>
                      )}
                      
                      {/* 原文摘要 */}
                      {source.anchor_text && (
                        <div
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#f5f5f5",
                            borderRadius: 6,
                            borderLeft: "3px solid #1890ff",
                            marginLeft: 20,
                          }}
                        >
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            原文摘要：
                          </Text>
                          <Paragraph
                            style={{ marginBottom: 0, marginTop: 4, fontSize: 13 }}
                            ellipsis={{ rows: 3, expandable: true, symbol: "展开" }}
                          >
                            {source.anchor_text}
                          </Paragraph>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无来源信息</Text>
              )}
            </Card>
          </div>
        )}
      </Modal>

      {/* 编辑关联弹窗 */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>编辑知识点关联</span>
          </Space>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        width={750}
      >
        {editingQuestion && (
          <div>
            {/* 显示题目信息 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                <QuestionCircleOutlined style={{ color: "#1890ff" }} />
                <Tag color={TYPE_MAP[editingQuestion.type]?.color || "default"}>
                  {TYPE_MAP[editingQuestion.type]?.label || editingQuestion.type}
                </Tag>
                <Text type="secondary">#{editingQuestion.id}</Text>
              </Space>
              <div>
                <Text strong>{editingQuestion.stem}</Text>
              </div>
            </Card>

            {/* 添加知识点 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                添加知识点：
              </Text>
              {allKnowledgeLoading ? (
                <Spin size="small" />
              ) : (
                <Select
                  style={{ width: "100%" }}
                  placeholder="搜索并选择要添加的知识点..."
                  showSearch
                  optionFilterProp="searchText"
                  options={availableKnowledgeOptions}
                  value={undefined}
                  onChange={(value) => {
                    if (value) handleAddKnowledge(value);
                  }}
                  filterOption={(input, option) => {
                    const searchText = option?.searchText || "";
                    return searchText.toLowerCase().includes(input.toLowerCase());
                  }}
                  suffixIcon={<PlusOutlined />}
                />
              )}
            </div>

            {/* 已关联的知识点列表（带权重编辑） */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8 }}>
                已关联知识点：
                <Tag color="blue" style={{ marginLeft: 8 }}>{editingLinks.length} 个</Tag>
              </Text>
              
              {editingLinks.length === 0 ? (
                <Empty description="暂无关联知识点" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {editingLinks.map((link, index) => {
                    const kn = getKnowledgeInfo(link.knowledge_node_id);
                    return (
                      <Card
                        key={link.knowledge_node_id}
                        size="small"
                        style={{ marginBottom: 8 }}
                        bodyStyle={{ padding: "12px 16px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Space>
                              <Tag color={IMPORTANCE_COLOR[kn?.importance] || "default"}>
                                {kn?.importance === 'high' ? '高' : kn?.importance === 'medium' ? '中' : '低'}
                              </Tag>
                              <Text ellipsis style={{ maxWidth: 350 }}>
                                {kn?.title || "未知知识点"}
                              </Text>
                            </Space>
                          </div>
                          
                          <Space style={{ flexShrink: 0, marginLeft: 16 }}>
                            <Text type="secondary">权重:</Text>
                            <InputNumber
                              min={0}
                              max={100}
                              value={link.weight}
                              onChange={(value) => handleUpdateWeight(link.knowledge_node_id, value || 0)}
                              style={{ width: 80 }}
                              addonAfter="%"
                              size="small"
                            />
                            <Tooltip title="移除">
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveKnowledge(link.knowledge_node_id)}
                              />
                            </Tooltip>
                          </Space>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
