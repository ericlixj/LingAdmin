import { Create, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";

export const StudySessionCreate = () => {
  const { formProps, saveButtonProps } = useForm();
  const [selectedMode, setSelectedMode] = useState<string>("practice");

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
      mode: "practice",
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 确保 user_id 和 exam_id 是数字
      user_id: typeof values.user_id === 'number' ? values.user_id : Number(values.user_id),
      exam_id: typeof values.exam_id === 'number' ? values.exam_id : Number(values.exam_id),
      // score 默认传 0（所有模式都传 0，即使不显示该字段）
      score: values.score !== null && values.score !== undefined ? values.score : 0,
      // flashcard 模式需要 daily_new_limit
      daily_new_limit: selectedMode === "flashcard" 
        ? (values.daily_new_limit !== null && values.daily_new_limit !== undefined ? values.daily_new_limit : 10)
        : null,
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
          initialValue="practice"
        >
          <Select
            options={[
                { label: "考试", value: "exam" },                { label: "练习", value: "practice" },                { label: "FlashCard", value: "flashcard" }            ]}
            onChange={(value) => setSelectedMode(value)}
          />

        </Form.Item>
        {selectedMode === "exam" && (
          <>
            <Form.Item
              name="exam_duration"
              label="考试时长（分钟）"
              rules={[
                { required: true, message: "请输入考试时长" },
                { type: "number", message: "必须是数字" }
              ]}
              initialValue={30}
            >
                  <InputNumber style={{ width: "100%" }} min={1} placeholder="考试时长（分钟），默认30" />
            </Form.Item>
            <Form.Item
              name="question_count"
              label="考试题目数量"
              rules={[
                { type: "number", message: "必须是数字" },
                { required: true, message: "请输入考试题目数量" }
              ]}
              initialValue={20}
            >
                  <InputNumber style={{ width: "100%" }} min={1} placeholder="考试题目数量" />
            </Form.Item>
          </>
        )}
        {selectedMode === "flashcard" && (
          <Form.Item
            name="daily_new_limit"
            label="每日学习数量"
            rules={[
              { required: true, message: "请输入每日学习数量" },
              { type: "number", message: "必须是数字" },
              {
                validator: (_, value) => {
                  if (value === null || value === undefined) {
                    return Promise.reject(new Error("请输入每日学习数量"));
                  }
                  if (typeof value !== 'number' || value < 1) {
                    return Promise.reject(new Error("每日学习数量至少为1"));
                  }
                  return Promise.resolve();
                }
              }
            ]}
            initialValue={10}
          >
            <InputNumber style={{ width: "100%" }} min={1} placeholder="每天新增学习的FlashCard数量，默认10" />
          </Form.Item>
        )}
        {/* score字段：只在非flashcard、非practice、非exam模式下显示（实际上所有模式都不需要） */}
        {selectedMode !== "flashcard" && selectedMode !== "practice" && selectedMode !== "exam" && (
          <Form.Item
            name="score"
            label="score"
            rules={[
              { required: true, message: "请输入分数" },
              { type: "number", message: "必须是数字" }
            ]}
            initialValue={0}
          >
            <InputNumber style={{ width: "100%" }} min={0} placeholder="分数，默认0" />
          </Form.Item>
        )}
      </Form>
    </Create>
  );
};