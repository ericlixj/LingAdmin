import { useState } from "react";
import { Show } from "@refinedev/antd";
import { useShow, useOne, useCustom } from "@refinedev/core";
import { Typography, Card, Tag, Space, Divider, Alert, Spin, Modal, Tooltip, Collapse } from "antd";
import { CheckCircleOutlined, BookOutlined, FileTextOutlined, EnvironmentOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

// 重要性颜色映射
const IMPORTANCE_COLOR: Record<string, string> = {
  high: "red",
  medium: "orange",
  low: "blue",
};

// 来源类型图标
const SOURCE_TYPE_ICON: Record<string, string> = {
  pdf: "📄",
  book: "📚",
  video: "🎬",
  web: "🌐",
};

// 默认选项字母映射
const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// 不再需要从 stem 中解析图片，直接使用 image_url 字段

// 题目类型
const TYPE_MAP: Record<string, { label: string; color: string }> = {
  single: { label: '单选题', color: 'blue' },
  multi: { label: '多选题', color: 'purple' },
  judge: { label: '判断题', color: 'orange' },
};

// 解析后的选项类型
interface ParsedOption {
  label: string;  // 选项标签 A/B/C/D
  value: string;  // 选项内容
}

// 解析选项 JSON - 返回 {label, value} 数组
// 支持格式：
// 1. 对象格式: {"A": "选项A", "B": "选项B", ...}
// 2. 数组格式: ["选项A", "选项B", ...]
// 3. 对象数组格式: [{label: "A", value: "选项A"}, ...]
const parseOptions = (optionsStr: string): ParsedOption[] => {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    
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
        if (typeof item === 'string') {
          // 纯字符串数组，使用默认标签
          return { label: DEFAULT_LABELS[index] || String(index + 1), value: item };
        }
        if (typeof item === 'object' && item !== null) {
          // {label: "A", value: "选项内容"} 格式
          return {
            label: item.label || DEFAULT_LABELS[index] || String(index + 1),
            value: item.value || item.text || '',
          };
        }
        return { label: DEFAULT_LABELS[index] || String(index + 1), value: String(item) };
      });
    }
    return [];
  } catch {
    // 如果不是 JSON，尝试按换行分割
    return optionsStr.split('\n').filter(Boolean).map((text, index) => ({
      label: DEFAULT_LABELS[index] || String(index + 1),
      value: text,
    }));
  }
};

// 解析答案 - 支持 "A" 或 ["A", "B"] 格式
const parseAnswer = (answerStr: string): string[] => {
  if (!answerStr) return [];
  try {
    const parsed = JSON.parse(answerStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => String(item));
    }
    return [String(parsed)];
  } catch {
    // 不是 JSON，直接返回原字符串（如 "A"）
    return [answerStr];
  }
};

// 来源章节组件
const SourceSection = ({ source }: { source: any }) => (
  <div style={{ 
    padding: "6px 10px", 
    backgroundColor: "#fafafa", 
    borderRadius: 4,
    borderLeft: "3px solid #1890ff",
    marginBottom: 4,
    fontSize: 12,
  }}>
    <Space size={4} wrap>
      {source.source && (
        <>
          <span>{SOURCE_TYPE_ICON[source.source.type] || "📄"}</span>
          <Text strong style={{ fontSize: 12 }}>{source.source.title}</Text>
          {source.source.version && (
            <Tag style={{ fontSize: 10, lineHeight: "14px", padding: "0 4px" }}>
              v{source.source.version}
            </Tag>
          )}
          <Text type="secondary">›</Text>
        </>
      )}
      <Text style={{ fontSize: 12 }}>
        {source.chapter}
        {source.section && ` › ${source.section}`}
      </Text>
      {(source.page_start || source.page_end) && (
        <Tag color="blue" style={{ fontSize: 10, lineHeight: "14px", padding: "0 4px" }}>
          P{source.page_start}{source.page_end && source.page_end !== source.page_start && `-${source.page_end}`}
        </Tag>
      )}
    </Space>
  </div>
);

export const StudyQuestionShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  const questionId = record?.id;

  // 知识点弹窗状态
  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<any>(null);
  
  // 来源章节弹窗状态
  const [sourceModalVisible, setSourceModalVisible] = useState(false);
  const [selectedSource, setSelectedSource] = useState<any>(null);

  // 获取考试信息
  const { data: examData } = useOne({
    resource: "studyExam",
    id: record?.exam_id,
    queryOptions: {
      enabled: !!record?.exam_id,
    },
  });

  // 获取关联的知识点（包含来源章节信息）
  const { data: linkedKnowledge, isLoading: knowledgeLoading } = useCustom({
    url: `studyQuestion/${questionId}/knowledge`,
    method: "get",
    queryOptions: {
      enabled: !!questionId,
    },
  });

  const options = parseOptions(record?.options || '');
  const answers = parseAnswer(record?.answer || '');
  const typeInfo = TYPE_MAP[record?.type] || { label: record?.type, color: 'default' };
  const examName = examData?.data?.name || `Exam #${record?.exam_id}`;
  const knowledgeNodes = linkedKnowledge?.data?.knowledge_nodes || [];
  const stemText = record?.stem || '';
  const stemImageUrl = record?.image_url || null;

  // 判断选项是否为正确答案（根据 label 判断）
  const isCorrectAnswer = (optionLabel: string): boolean => {
    return answers.includes(optionLabel) || answers.includes(optionLabel.toLowerCase());
  };

  // 显示知识点详情弹窗
  const showKnowledgeDetail = (kn: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedKnowledge(kn);
    setKnowledgeModalVisible(true);
  };

  // 显示来源章节详情弹窗
  const showSourceDetail = (source: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedSource(source);
    setSourceModalVisible(true);
  };

  // 构建 Collapse 的 items
  const collapseItems = knowledgeNodes.map((kn: any) => ({
    key: kn.id,
    label: (
      <Space>
        <Tag color={IMPORTANCE_COLOR[kn.importance] || "default"}>
          {kn.importance === 'high' ? '高' : kn.importance === 'medium' ? '中' : '低'}
        </Tag>
        <Text 
          ellipsis 
          style={{ maxWidth: 500, cursor: 'pointer', color: '#1890ff' }}
          onClick={(e) => showKnowledgeDetail(kn, e)}
        >
          {kn.title}
        </Text>
        {kn.sources && kn.sources.length > 0 && (
          <Tag color="cyan" style={{ fontSize: 11 }}>
            {kn.sources.length} 个来源
          </Tag>
        )}
      </Space>
    ),
    children: (
      <div>
        {/* 知识点描述 */}
        {kn.description && (
          <div style={{ 
            marginBottom: 12, 
            padding: 10, 
            backgroundColor: '#f6ffed', 
            borderRadius: 4,
            borderLeft: '3px solid #52c41a',
          }}>
            <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>📝 知识点描述：</Text>
            <Text style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{kn.description}</Text>
          </div>
        )}
        
        {/* 来源章节列表 */}
        {kn.sources && kn.sources.length > 0 ? (
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
              <FileTextOutlined style={{ marginRight: 4 }} />
              来源章节（点击查看详情）:
            </Text>
            {kn.sources.map((source: any, idx: number) => (
              <div 
                key={idx}
                onClick={(e) => showSourceDetail(source, e)}
                style={{ 
                  padding: "8px 10px", 
                  backgroundColor: "#fafafa", 
                  borderRadius: 4,
                  borderLeft: "3px solid #1890ff",
                  marginBottom: 8,
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e6f7ff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
              >
                <Space size={4} wrap>
                  {source.source && (
                    <>
                      <span>{SOURCE_TYPE_ICON[source.source.type] || "📄"}</span>
                      <Text strong style={{ fontSize: 12, color: '#1890ff' }}>{source.source.title}</Text>
                      {source.source.version && (
                        <Tag style={{ fontSize: 10, lineHeight: "14px", padding: "0 4px" }}>
                          v{source.source.version}
                        </Tag>
                      )}
                      <Text type="secondary">›</Text>
                    </>
                  )}
                  <Text style={{ fontSize: 12 }}>
                    {source.chapter}
                    {source.section && ` › ${source.section}`}
                  </Text>
                  {(source.page_start || source.page_end) && (
                    <Tag color="blue" style={{ fontSize: 10, lineHeight: "14px", padding: "0 4px" }}>
                      P{source.page_start}{source.page_end && source.page_end !== source.page_start && `-${source.page_end}`}
                    </Tag>
                  )}
                </Space>
                {/* 原文摘要预览 */}
                {source.anchor_text && (
                  <div style={{ 
                    marginTop: 6, 
                    padding: '6px 8px', 
                    backgroundColor: '#fff', 
                    borderRadius: 4,
                    fontSize: 11,
                    color: '#666',
                    borderLeft: '2px solid #d9d9d9',
                  }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {source.anchor_text.length > 150 
                        ? source.anchor_text.substring(0, 150) + '...' 
                        : source.anchor_text}
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>暂无来源信息</Text>
        )}
        
        {/* 查看详情链接 */}
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <a 
            style={{ fontSize: 12 }}
            onClick={(e) => showKnowledgeDetail(kn, e)}
          >
            查看完整详情 →
          </a>
        </div>
      </div>
    ),
  }));

  return (
    <>
      <Show isLoading={isLoading}>
        {/* 题目信息 */}
        <Card style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16 }}>
            <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
            <Text type="secondary">ID: {record?.id}</Text>
            <Tag color="cyan">考试: {examName}</Tag>
            <Tag color={record?.status === 1 ? 'success' : 'default'}>
              {record?.status === 1 ? '开启' : '关闭'}
            </Tag>
          </Space>

          {/* 题干 */}
          <Title level={4} style={{ marginTop: 8 }}>
            {stemText}
          </Title>

          {/* 题干图片 */}
          {stemImageUrl && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <img 
                src={stemImageUrl} 
                alt="题目图片" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* 选项列表 */}
          <div style={{ marginTop: 24 }}>
            {options.map((option, index) => {
              const isCorrect = isCorrectAnswer(option.label);
              return (
                <div
                  key={index}
                  style={{
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: isCorrect ? '2px solid #52c41a' : '1px solid #d9d9d9',
                    backgroundColor: isCorrect ? '#f6ffed' : '#fff',
                    display: 'flex',
                    alignItems: 'flex-start',
                  }}
                >
                  <Tag
                    color={isCorrect ? 'success' : 'default'}
                    style={{ marginRight: 12, minWidth: 24, textAlign: 'center' }}
                  >
                    {option.label}
                  </Tag>
                  <Text style={{ flex: 1 }}>{option.value}</Text>
                  {isCorrect && (
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* 答案区域 */}
        <Card title="✅ 正确答案" style={{ marginBottom: 16 }}>
          <Space size="middle">
            {answers.map((ans, index) => (
              <Tag key={index} color="success" style={{ fontSize: 16, padding: '4px 12px' }}>
                {ans}
              </Tag>
            ))}
          </Space>
        </Card>

        {/* 解释区域 */}
        {(record?.explanation_raw || record?.explanation_human) && (
          <Card title="📖 解析" style={{ marginBottom: 16 }}>
            {record?.explanation_raw && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  官方解释：
                </Text>
                <Alert
                  type="info"
                  message={
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {record.explanation_raw}
                    </Paragraph>
                  }
                  style={{ marginBottom: 16 }}
                />
              </>
            )}

            {record?.explanation_human && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  通俗解释：
                </Text>
                <Alert
                  type="success"
                  message={
                    <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {record.explanation_human}
                    </Paragraph>
                  }
                />
              </>
            )}
          </Card>
        )}

        {/* 关联知识点（含来源章节） */}
        <Card
          title={
            <Space>
              <BookOutlined />
              <span>关联知识点</span>
              <Tag color="blue">{knowledgeNodes.length} 个</Tag>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {knowledgeLoading ? (
            <Spin size="small" />
          ) : knowledgeNodes.length > 0 ? (
            <Collapse 
              items={collapseItems}
              defaultActiveKey={knowledgeNodes.length <= 3 ? knowledgeNodes.map((kn: any) => kn.id) : []}
              size="small"
            />
          ) : (
            <Text type="secondary">暂无关联知识点</Text>
          )}
        </Card>

        {/* 元信息 */}
        <Card title="ℹ️ 其他信息" size="small">
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary">创建人: {record?.creator || '-'}</Text>
            <Text type="secondary">
              创建时间: {record?.create_time ? new Date(record.create_time).toLocaleString() : '-'}
            </Text>
          </Space>
        </Card>
      </Show>

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
                <Text type="secondary">编码: {selectedKnowledge.code}</Text>
              </Space>
              <Title level={5} style={{ marginTop: 0 }}>
                {selectedKnowledge.title}
              </Title>
            </Card>

            {/* 知识点描述 */}
            <Card size="small" title="📝 知识点描述" style={{ marginBottom: 16 }}>
              {selectedKnowledge.description ? (
                <Paragraph style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f9f9f9',
                  padding: 12,
                  borderRadius: 4,
                }}>
                  {selectedKnowledge.description}
                </Paragraph>
              ) : (
                <Text type="secondary">暂无描述</Text>
              )}
            </Card>

            {/* 来源信息 */}
            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  <span>来源信息</span>
                  <Tag color="cyan">{selectedKnowledge.sources?.length || 0} 个来源</Tag>
                </Space>
              }
            >
              {selectedKnowledge.sources && selectedKnowledge.sources.length > 0 ? (
                <div>
                  {selectedKnowledge.sources.map((source: any, index: number) => (
                    <div 
                      key={index}
                      style={{ cursor: 'pointer' }}
                      onClick={() => showSourceDetail(source)}
                    >
                      {index > 0 && <Divider style={{ margin: "12px 0" }} />}
                      
                      {/* 教材信息 */}
                      {source.source && (
                        <div style={{ marginBottom: 8 }}>
                          <Space>
                            <span>{SOURCE_TYPE_ICON[source.source.type] || "📄"}</span>
                            <Text strong style={{ color: '#1890ff' }}>{source.source.title}</Text>
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

      {/* 来源章节详情弹窗 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>来源章节详情</span>
          </Space>
        }
        open={sourceModalVisible}
        onCancel={() => setSourceModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedSource && (
          <div>
            {/* 教材信息 */}
            {selectedSource.source && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
                  <Space>
                    <span>{SOURCE_TYPE_ICON[selectedSource.source.type] || "📄"}</span>
                    {selectedSource.source.title}
                  </Space>
                </Title>
                <Space wrap>
                  {selectedSource.source.version && (
                    <Tag color="blue">版本: v{selectedSource.source.version}</Tag>
                  )}
                  {selectedSource.source.type && (
                    <Tag color="green">类型: {selectedSource.source.type}</Tag>
                  )}
                  {selectedSource.source.publisher && (
                    <Tag>出版商: {selectedSource.source.publisher}</Tag>
                  )}
                </Space>
                {selectedSource.source.description && (
                  <Paragraph style={{ marginTop: 12, marginBottom: 0 }} type="secondary">
                    {selectedSource.source.description}
                  </Paragraph>
                )}
              </Card>
            )}

            {/* 章节信息 */}
            <Card size="small" title="📍 章节位置">
              <div style={{ marginBottom: 12 }}>
                <Text strong>章节: </Text>
                <Text>{selectedSource.chapter || '-'}</Text>
              </div>
              {selectedSource.section && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>小节: </Text>
                  <Text>{selectedSource.section}</Text>
                </div>
              )}
              {(selectedSource.page_start || selectedSource.page_end) && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>页码: </Text>
                  <Tag color="blue">
                    P{selectedSource.page_start}
                    {selectedSource.page_end && selectedSource.page_end !== selectedSource.page_start && ` - P${selectedSource.page_end}`}
                  </Tag>
                </div>
              )}
            </Card>

            {/* 原文摘要 */}
            {selectedSource.anchor_text && (
              <Card size="small" title="📝 原文摘要" style={{ marginTop: 16 }}>
                <Paragraph style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#f9f9f9',
                  padding: 12,
                  borderRadius: 4,
                  borderLeft: '3px solid #1890ff',
                }}>
                  {selectedSource.anchor_text}
                </Paragraph>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
