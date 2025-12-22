import { Create, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber, Spin } from "antd";
import { useEffect, useMemo } from "react";

export const StudySessionCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 获取用户列表
  const { data: usersData, isLoading: usersLoading } = useList({
    resource: "user",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 获取考试列表
  const { data: examsData, isLoading: examsLoading } = useList({
    resource: "studyExam",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 用户选项
  const userOptions = useMemo(() => {
    return (usersData?.data || []).map((user: any) => ({
      label: user.full_name || user.email || `ID: ${user.id}`,
      value: user.id,
      searchText: `${user.full_name || ''} ${user.email || ''} ${user.id}`,
    }));
  }, [usersData]);

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
      // 确保 user_id 和 exam_id 是数字
      user_id: typeof values.user_id === 'number' ? values.user_id : Number(values.user_id),
      exam_id: typeof values.exam_id === 'number' ? values.exam_id : Number(values.exam_id),
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="user_id"
          label="用户"
          rules={[
            { required: true, message: "请选择用户" }
          ]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder="选择用户..."
            options={userOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.searchText ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={usersLoading}
            notFoundContent={usersLoading ? <Spin size="small" /> : "暂无数据"}
            onChange={(value) => {
              formProps.form?.setFieldsValue({ user_id: Number(value) });
            }}
          />
        </Form.Item>
        <Form.Item
          name="exam_id"
          label="考试"
          rules={[
            { required: true, message: "请选择考试" }
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
              formProps.form?.setFieldsValue({ exam_id: Number(value) });
            }}
          />
        </Form.Item>
        <Form.Item
          name="mode"
          label="学习模式"
          rules={[
            { required: true, message: '请输入学习模式' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
          <Select
            options={[
                { label: "考试", value: "exam" },                { label: "练习", value: "practice" },                { label: "复习", value: "review" },                { label: "FlashCard", value: "flashcard" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="start_time"
          label="start_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="end_time"
          label="end_time"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="score"
          label="score"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};