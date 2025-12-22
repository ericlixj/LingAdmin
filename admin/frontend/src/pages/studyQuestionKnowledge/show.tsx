import { useState } from "react";
import { Show } from "@refinedev/antd";
import { useShow, useOne } from "@refinedev/core";
import { Typography, Card, Tag, Space, Modal, Alert, Descriptions, Divider } from "antd";
import { QuestionCircleOutlined, BookOutlined, CheckCircleOutlined, LinkOutlined } from "@ant-design/icons";

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

export const StudyQuestionKnowledgeShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  // 获取题目信息
  const { data: questionData } = useOne({
    resource: "studyQuestion",
    id: record?.question_id,
    queryOptions: {
      enabled: !!record?.question_id,
    },
  });

  // 获取知识点信息
  const { data: knowledgeData } = useOne({
    resource: "studyKnowledgeNode",
    id: record?.knowledge_node_id,
    queryOptions: {
      enabled: !!record?.knowledge_node_id,
    },
  });

  const question = questionData?.data;
  const knowledge = knowledgeData?.data;

  // 弹窗状态
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);

  return (
    <>
      <Show isLoading={isLoading}>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="关联 ID">
            <Tag color="blue">#{record?.id}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="题目">
            {question ? (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setQuestionModalVisible(true)}
              >
                <Space>
                  <QuestionCircleOutlined style={{ color: "#1890ff" }} />
                  <Tag color={TYPE_MAP[question.type]?.color || "default"}>
                    {TYPE_MAP[question.type]?.label || question.type}
                  </Tag>
                  <LinkOutlined style={{ color: "#1890ff" }} />
                </Space>
                <div style={{ marginTop: 8, maxWidth: 500 }}>
                  <Text>{question.stem}</Text>
                </div>
              </div>
            ) : (
              <Text type="secondary">#{record?.question_id}</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="知识点">
            {knowledge ? (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setKnowledgeModalVisible(true)}
              >
                <Space>
                  <BookOutlined style={{ color: "#52c41a" }} />
                  <Tag color={IMPORTANCE_COLOR[knowledge.importance] || "default"}>
                    {knowledge.code}
                  </Tag>
                  <LinkOutlined style={{ color: "#52c41a" }} />
                </Space>
                <div style={{ marginTop: 8, maxWidth: 500 }}>
                  <Text>{knowledge.title}</Text>
                </div>
              </div>
            ) : (
              <Text type="secondary">#{record?.knowledge_node_id}</Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="关联权重">
            <Tag color={record?.weight >= 70 ? "green" : record?.weight >= 40 ? "orange" : "default"}>
              {record?.weight}%
            </Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              (0-100，越高表示关联越强)
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="创建信息">
            <Space split={<Divider type="vertical" />}>
              <Text type="secondary">创建人: {record?.creator || "-"}</Text>
              <Text type="secondary">
                创建时间: {record?.create_time ? new Date(record.create_time).toLocaleString() : "-"}
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Show>

      {/* 题目详情弹窗 */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined />
            <span>题目详情</span>
            {question && <Tag color="blue">#{question.id}</Tag>}
          </Space>
        }
        open={questionModalVisible}
        onCancel={() => setQuestionModalVisible(false)}
        footer={null}
        width={700}
      >
        {question && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                <Tag color={TYPE_MAP[question.type]?.color || "default"}>
                  {TYPE_MAP[question.type]?.label || question.type}
                </Tag>
                <Tag color={question.status === 1 ? "success" : "default"}>
                  {question.status === 1 ? "开启" : "关闭"}
                </Tag>
              </Space>
              <Title level={5} style={{ marginTop: 0 }}>
                {question.stem}
              </Title>

              {/* 选项 */}
              <div style={{ marginTop: 16 }}>
                {parseOptions(question.options).map((opt: any, idx: number) => {
                  const answers = parseAnswer(question.answer);
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
            {(question.explanation_raw || question.explanation_human) && (
              <Card size="small" title="📖 解析">
                {question.explanation_raw && (
                  <Alert
                    type="info"
                    message={<Paragraph style={{ margin: 0 }}>{question.explanation_raw}</Paragraph>}
                    style={{ marginBottom: question.explanation_human ? 12 : 0 }}
                  />
                )}
                {question.explanation_human && (
                  <Alert
                    type="success"
                    message={<Paragraph style={{ margin: 0 }}>{question.explanation_human}</Paragraph>}
                  />
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
            {knowledge && (
              <Tag color={IMPORTANCE_COLOR[knowledge.importance] || "default"}>
                {knowledge.code}
              </Tag>
            )}
          </Space>
        }
        open={knowledgeModalVisible}
        onCancel={() => setKnowledgeModalVisible(false)}
        footer={null}
        width={600}
      >
        {knowledge && (
          <div>
            <Card size="small">
              <Space style={{ marginBottom: 12 }}>
                <Tag color={IMPORTANCE_COLOR[knowledge.importance] || "default"}>
                  重要性: {knowledge.importance}
                </Tag>
                <Text type="secondary">ID: #{knowledge.id}</Text>
              </Space>
              <Title level={5} style={{ marginTop: 0 }}>
                {knowledge.title}
              </Title>
              {knowledge.description && (
                <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                  {knowledge.description}
                </Paragraph>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </>
  );
};
