import { useState, useEffect } from "react";
import { Create, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Select, InputNumber, Space, Tag, Card, Typography } from "antd";
import { QuestionCircleOutlined, BookOutlined } from "@ant-design/icons";

const { Text } = Typography;

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

export const StudyQuestionKnowledgeCreate = () => {
  const { formProps, saveButtonProps } = useForm();
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<number | null>(null);

  // 获取考试列表
  const { data: examData } = useList({
    resource: "studyExam",
    pagination: { pageSize: 100 },
  });

  // 获取题目列表
  const { data: questionsData, isLoading: questionsLoading } = useList({
    resource: "studyQuestion",
    pagination: { pageSize: 500 },
    filters: selectedExamId ? [{ field: "exam_id", operator: "eq", value: selectedExamId }] : [],
  });

  // 获取知识点列表
  const { data: knowledgeData, isLoading: knowledgeLoading } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 500 },
    filters: selectedExamId ? [{ field: "exam_id", operator: "eq", value: selectedExamId }] : [],
  });

  // 设置默认权重
  useEffect(() => {
    formProps.form?.setFieldsValue({ weight: 50 });
  }, [formProps.form]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  // 选中的题目和知识点信息
  const selectedQuestion = questionsData?.data?.find((q: any) => q.id === selectedQuestionId);
  const selectedKnowledge = knowledgeData?.data?.find((k: any) => k.id === selectedKnowledgeId);

  // 题目选项
  const questionOptions = (questionsData?.data || []).map((q: any) => {
    const typeInfo = TYPE_MAP[q.type] || { label: q.type, color: "default" };
    return {
      label: (
        <Space>
          <Tag color={typeInfo.color} style={{ marginRight: 4 }}>
            {typeInfo.label}
          </Tag>
          <span style={{ maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
            {q.stem.slice(0, 60)}{q.stem.length > 60 ? "..." : ""}
          </span>
        </Space>
      ),
      value: q.id,
      searchText: `${q.id} ${q.stem}`,
    };
  });

  // 知识点选项
  const knowledgeOptions = (knowledgeData?.data || []).map((k: any) => ({
    label: (
      <Space>
        <Tag color={IMPORTANCE_COLOR[k.importance] || "default"} style={{ marginRight: 4 }}>
          {k.code}
        </Tag>
        <span style={{ maxWidth: 350, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
          {k.title.slice(0, 50)}{k.title.length > 50 ? "..." : ""}
        </span>
      </Space>
    ),
    value: k.id,
    searchText: `${k.code} ${k.title}`,
  }));

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        {/* 考试筛选器（不是表单字段） */}
        <Form.Item label="按考试筛选（推荐）">
          <Select
            placeholder="选择考试以筛选题目和知识点"
            allowClear
            value={selectedExamId}
            onChange={(value) => {
              setSelectedExamId(value);
              // 清空已选的题目和知识点
              setSelectedQuestionId(null);
              setSelectedKnowledgeId(null);
              formProps.form?.setFieldsValue({
                question_id: undefined,
                knowledge_node_id: undefined,
              });
            }}
            options={examData?.data?.map((exam: any) => ({
              label: exam.name,
              value: exam.id,
            }))}
            style={{ width: 300 }}
          />
        </Form.Item>

        <Form.Item
          name="question_id"
          label={
            <Space>
              <QuestionCircleOutlined />
              <span>题目</span>
            </Space>
          }
          rules={[{ required: true, message: "请选择题目" }]}
        >
          <Select
            showSearch
            placeholder="搜索并选择题目..."
            loading={questionsLoading}
            options={questionOptions}
            optionFilterProp="searchText"
            onChange={(value) => setSelectedQuestionId(value)}
            filterOption={(input, option) => {
              const searchText = option?.searchText || "";
              return searchText.toLowerCase().includes(input.toLowerCase());
            }}
          />
        </Form.Item>

        {/* 显示选中的题目详情 */}
        {selectedQuestion && (
          <Card size="small" style={{ marginBottom: 24, marginTop: -16 }}>
            <Text strong>题干: </Text>
            <Text>{selectedQuestion.stem}</Text>
          </Card>
        )}

        <Form.Item
          name="knowledge_node_id"
          label={
            <Space>
              <BookOutlined />
              <span>知识点</span>
            </Space>
          }
          rules={[{ required: true, message: "请选择知识点" }]}
        >
          <Select
            showSearch
            placeholder="搜索并选择知识点..."
            loading={knowledgeLoading}
            options={knowledgeOptions}
            optionFilterProp="searchText"
            onChange={(value) => setSelectedKnowledgeId(value)}
            filterOption={(input, option) => {
              const searchText = option?.searchText || "";
              return searchText.toLowerCase().includes(input.toLowerCase());
            }}
          />
        </Form.Item>

        {/* 显示选中的知识点详情 */}
        {selectedKnowledge && (
          <Card size="small" style={{ marginBottom: 24, marginTop: -16 }}>
            <Text strong>描述: </Text>
            <Text>{selectedKnowledge.description || selectedKnowledge.title}</Text>
          </Card>
        )}

        <Form.Item
          name="weight"
          label="关联权重"
          rules={[{ required: true, message: "请输入权重" }]}
          extra="0-100，越高表示关联越强"
        >
          <InputNumber min={0} max={100} style={{ width: 200 }} addonAfter="%" />
        </Form.Item>
      </Form>
    </Create>
  );
};
