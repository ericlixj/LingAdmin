import { useState, useEffect } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { useList, useCustom, useCustomMutation } from "@refinedev/core";
import { Form, Input, Select, Spin, Card, Tag, Space, message, Divider, Image } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { getProxyImageUrl } from "../../utils/imageProxy";

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

// 重要性颜色映射
const IMPORTANCE_COLOR: Record<string, string> = {
  high: "red",
  medium: "orange",
  low: "blue",
};

export const StudyQuestionEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>([]);
  const [knowledgeSaving, setKnowledgeSaving] = useState(false);

  // 获取考试列表
  const { data: examData } = useList({
    resource: "studyExam",
    pagination: { pageSize: 100 },
  });

  const record = queryResult?.data?.data;
  const form = formProps?.form;
  const questionId = record?.id;
  const examId = record?.exam_id;

  // 获取知识点列表（根据 exam_id 筛选）
  const { data: knowledgeData, isLoading: knowledgeLoading } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 500 },
    filters: examId ? [{ field: "exam_id", operator: "eq", value: examId }] : [],
    queryOptions: {
      enabled: !!examId,
    },
  });

  // 获取题目已关联的知识点
  const { data: linkedKnowledge, refetch: refetchLinked } = useCustom({
    url: `studyQuestion/${questionId}/knowledge`,
    method: "get",
    queryOptions: {
      enabled: !!questionId,
    },
  });

  // 更新关联的 mutation
  const { mutate: updateKnowledge } = useCustomMutation();

  // 初始化已关联的知识点
  useEffect(() => {
    if (linkedKnowledge?.data?.knowledge_nodes) {
      const ids = linkedKnowledge.data.knowledge_nodes.map((kn: any) => kn.id);
      setSelectedKnowledgeIds(ids);
    }
  }, [linkedKnowledge]);

  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      form.setFieldsValue(record);
      setInitialized(true);
    }
  }, [initialized, record, form]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  // 保存知识点关联
  const handleSaveKnowledge = () => {
    if (!questionId) return;
    
    setKnowledgeSaving(true);
    updateKnowledge(
      {
        url: `studyQuestion/${questionId}/knowledge`,
        method: "put",
        values: {
          knowledge_node_ids: selectedKnowledgeIds,
        },
        config: {
          data: {
            knowledge_node_ids: selectedKnowledgeIds,
          },
        },
      },
      {
        onSuccess: () => {
          message.success("知识点关联已更新");
          refetchLinked();
          setKnowledgeSaving(false);
        },
        onError: () => {
          message.error("更新失败");
          setKnowledgeSaving(false);
        },
      }
    );
  };

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  const knowledgeOptions = (knowledgeData?.data || []).map((kn: any) => ({
    label: (
      <Space>
        <Tag color={IMPORTANCE_COLOR[kn.importance] || "default"} style={{ marginRight: 4 }}>
          {kn.code}
        </Tag>
        <span>{kn.title}</span>
      </Space>
    ),
    value: kn.id,
    searchText: `${kn.code} ${kn.title}`,
  }));

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="exam_id"
          label="考试"
          rules={[{ required: true, message: "请选择考试" }]}
        >
          <Select
            placeholder="请选择考试"
            options={examData?.data?.map((exam: any) => ({
              label: exam.name,
              value: exam.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="题目类型"
          rules={[{ required: true, message: "请选择题目类型" }]}
        >
          <Select placeholder="请选择题目类型" options={TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="stem"
          label="题干"
          rules={[
            { required: true, message: "请输入题干" },
            { max: 9999, message: "最多输入 9999 个字符" },
          ]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="options"
          label="选项JSON"
          rules={[
            { required: true, message: "请输入选项JSON" },
            { max: 9999, message: "最多输入 9999 个字符" },
          ]}
          extra='格式：{"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"}'
        >
          <Input.TextArea rows={4} placeholder='{"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"}' />
        </Form.Item>

        <Form.Item
          name="answer"
          label="答案"
          rules={[
            { required: true, message: "请输入答案" },
            { max: 9999, message: "最多输入 9999 个字符" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="explanation_raw"
          label="官方解释"
          rules={[{ max: 9999, message: "最多输入 9999 个字符" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="explanation_human"
          label="通俗解释"
          rules={[{ max: 9999, message: "最多输入 9999 个字符" }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="image_url"
          label="题目图片URL"
          rules={[
            { max: 500, message: "最多输入 500 个字符" },
            { type: "url", message: "请输入有效的URL" }
          ]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>
        {record?.image_url && (
          <Form.Item label="图片预览">
            <Image
              src={getProxyImageUrl(record.image_url)}
              alt="题目图片"
              style={{ maxWidth: "300px", maxHeight: "300px" }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvqVx1emZM3FeB9T4llBQV4nFictyt5PwDxepNyUV4MwHjCy0pElBsVe8dA1HfRg8I7HhCwB3IewG5QfEaInALkOgB3QL2FyBYiBkD6AqwiwG3gQ6AKhFhCfC7MQk3MQk7aHhTeBB4X3haDPCcUZBYlq3q2DxLBUktUKHpvKXpJaBYnfxGrFwM0t7cyFXJTspXUO+HYwrspjJChgOGEpVaxSYWHQKA4L1damfM9LwygU9bKwg+pX1PAcfeh4nB2BiQWHRFgMD0eEDPXcGYFjzJwPBYLWhNPjBxTrtwsFNgUFi5LbWD8UxPSlGRoY9hTgPDvYJACxK1Gu8pvAsv0jwB/yzE4Ftgf8aQ4MAbvW4Bx75jMPjKe78b28H///fHMzA/v+u499gPzfmYH5+B3n4HpD4jQH8Kvz3YW5joR8B8O9E8P8I8L//+xf4//9PzQwM/w4A8fwJ7XqjjskdY2IAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
            <div style={{ marginTop: "8px" }}>
              <a href={record.image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px" }}>
                在新窗口打开原图
              </a>
            </div>
          </Form.Item>
        )}

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: "请选择状态" }]}
        >
          <Select placeholder="请选择状态" options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>

      <Divider />

      {/* 知识点关联区域 */}
      <Card
        title={
          <Space>
            <BookOutlined />
            <span>关联知识点</span>
            <Tag color="blue">{selectedKnowledgeIds.length} 个</Tag>
          </Space>
        }
        extra={
          <a onClick={handleSaveKnowledge} style={{ cursor: knowledgeSaving ? "wait" : "pointer" }}>
            {knowledgeSaving ? "保存中..." : "保存关联"}
          </a>
        }
      >
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          placeholder="选择关联的知识点..."
          value={selectedKnowledgeIds}
          onChange={setSelectedKnowledgeIds}
          loading={knowledgeLoading}
          optionFilterProp="searchText"
          options={knowledgeOptions}
          maxTagCount={5}
          showSearch
          filterOption={(input, option) => {
            const searchText = option?.searchText || "";
            return searchText.toLowerCase().includes(input.toLowerCase());
          }}
        />

        {selectedKnowledgeIds.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 8, color: "#666" }}>已选择的知识点：</div>
            <Space wrap>
              {selectedKnowledgeIds.map((id) => {
                const kn = knowledgeData?.data?.find((k: any) => k.id === id);
                if (!kn) return null;
                return (
                  <Tag
                    key={id}
                    color={IMPORTANCE_COLOR[kn.importance] || "default"}
                    closable
                    onClose={() => {
                      setSelectedKnowledgeIds((prev) => prev.filter((i) => i !== id));
                    }}
                  >
                    [{kn.code}] {kn.title.slice(0, 30)}
                    {kn.title.length > 30 ? "..." : ""}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
      </Card>
    </Edit>
  );
};
