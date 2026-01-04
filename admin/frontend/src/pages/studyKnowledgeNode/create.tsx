import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Spin } from "antd";
import { useEffect, useMemo } from "react";
import { useList } from "@refinedev/core";

export const StudyKnowledgeNodeCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 获取考试列表
  const { data: examsData, isLoading: examsLoading } = useList({
    resource: "studyExam",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 考试选项
  const examOptions = useMemo(() => {
    return (examsData?.data || []).map((exam: any) => ({
      label: exam.name || `ID: ${exam.id}`,
      value: exam.id,
      searchText: `${exam.name || ''} ${exam.code || ''} ${exam.id}`,
    }));
  }, [examsData]);

  useEffect(() => {
    const defaults = {
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 确保 exam_id 是数字
      exam_id: typeof values.exam_id === 'number' ? values.exam_id : (values.exam_id ? Number(values.exam_id) : null),
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="exam_id"
          label="关联exam"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder="选择考试..."
            options={examOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.searchText ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={examsLoading}
            notFoundContent={examsLoading ? <Spin size="small" /> : "暂无数据"}
            onChange={(value) => {
              formProps.form?.setFieldsValue({ exam_id: value ? Number(value) : null });
            }}
          />
        </Form.Item>
        <Form.Item
          name="code"
          label="code"
          rules={[
            { required: true, message: '请输入code' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="importance"
          label="importance"
          rules={[
            { required: true, message: '请输入importance' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "高", value: "high" },                { label: "中", value: "mid" },                { label: "低", value: "low" }            ]}
          />

        </Form.Item>
      </Form>
    </Create>
  );
};