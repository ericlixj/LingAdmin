import { useState, useEffect, useMemo } from "react";
import { Edit, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Select, Spin } from "antd";

// 类型选项
const TYPE_OPTIONS = [
  { label: "知识点", value: "knowledge" },
  { label: "题目", value: "question" },
];

export const StudyLearningItemEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("knowledge");

  const record = queryResult?.data?.data;
  const form = formProps?.form;

  // 获取知识点列表
  const { data: knowledgeData, isLoading: knowledgeLoading } = useList({
    resource: "studyKnowledgeNode",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
    queryOptions: {
      enabled: selectedType === "knowledge",
    },
  });

  // 获取题目列表
  const { data: questionData, isLoading: questionLoading } = useList({
    resource: "studyQuestion",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
    queryOptions: {
      enabled: selectedType === "question",
    },
  });

  // 根据类型生成选项
  const entityOptions = useMemo(() => {
    if (selectedType === "knowledge") {
      return (knowledgeData?.data || []).map((item: any) => ({
        label: `${item.code} - ${item.title}`,
        value: item.id,
        item: item,
      }));
    } else if (selectedType === "question") {
      return (questionData?.data || []).map((item: any) => {
        const stem = item.stem || "";
        // 移除图片标记
        const cleanStem = stem.replace(/\n?\[IMAGE:.*?\]/, '').trim();
        return {
          label: cleanStem.length > 50 ? cleanStem.substring(0, 50) + "..." : cleanStem,
          value: item.id,
          item: item,
        };
      });
    }
    return [];
  }, [selectedType, knowledgeData, questionData]);

  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      form.setFieldsValue(record);
      setSelectedType(record.type || "knowledge");
      setInitialized(true);
    }
  }, [initialized, record, form]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    // 清空 ref_id
    formProps.form?.setFieldsValue({ ref_id: undefined });
  };

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 确保 ref_id 是数字
      ref_id: typeof values.ref_id === 'number' ? values.ref_id : Number(values.ref_id),
    };
    return formProps.onFinish?.(processed);
  };

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }

  const isLoading = selectedType === "knowledge" ? knowledgeLoading : questionLoading;

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="type"
          label="类型"
          rules={[
            { required: true, message: "请选择类型" }
          ]}
        >
          <Select
            placeholder="选择类型"
            options={TYPE_OPTIONS}
            onChange={handleTypeChange}
          />
        </Form.Item>
        <Form.Item
          name="ref_id"
          label={selectedType === "knowledge" ? "选择知识点" : "选择题目"}
          rules={[
            { required: true, message: `请选择${selectedType === "knowledge" ? "知识点" : "题目"}` }
          ]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder={`选择${selectedType === "knowledge" ? "知识点" : "题目"}...`}
            options={entityOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={isLoading}
            notFoundContent={isLoading ? <Spin size="small" /> : "暂无数据"}
            onChange={(value) => {
              // value 是选项的 value (ID)
              formProps.form?.setFieldsValue({ ref_id: Number(value) });
            }}
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};