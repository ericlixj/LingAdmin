import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";

const fields = [{"common": true, "default": null, "description": "pk", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "user_id", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "user_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "exam_id", "form_type": "input", "index": false, "insertable": false, "listable": true, "max_length": null, "name": "exam_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5b66\u4e60\u6a21\u5f0f", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": 32, "name": "mode", "nullable": false, "options": [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "start_time", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "start_time", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "end_time", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "end_time", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "score", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "score", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}];

function prepareInitialValues(record: Record<string, any>, fields: any[]) {
  const result: Record<string, any> = {};
  fields.forEach((field) => {
    const value = record[field.name];
    if (field.form_type === "date") {
      result[field.name] = value ? dayjs(value) : null;
    } else if (field.form_type === "checkbox" && field.options) {
      result[field.name] = value ? value.split(",").map((v: string) => v.trim()) : [];
    } else if (field.form_type === "select") {
      result[field.name] = String(value);
    } else {
      result[field.name] = value;
    }
  });
  return result;
}

export const StudySessionEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>("");

  const record = queryResult?.data?.data;
  const form = formProps?.form;

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
    if (!initialized && record && form && !form.isFieldsTouched()) {
      const initialValues = prepareInitialValues(record, fields);
      // 如果 score 为 null 或 undefined，设置为 0
      if (initialValues.score === null || initialValues.score === undefined) {
        initialValues.score = 0;
      }
      // 如果 exam_duration 为 null 或 undefined，设置为 30
      if (initialValues.exam_duration === null || initialValues.exam_duration === undefined) {
        initialValues.exam_duration = 30;
      }
      // 如果 mode 为空，设置为 "practice"
      if (!initialValues.mode || initialValues.mode === "") {
        initialValues.mode = "practice";
      }
      form.setFieldsValue(initialValues);
      setSelectedMode(record.mode || "practice");
      setInitialized(true);
    }
  }, [initialized, record, form]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 确保 user_id 和 exam_id 是数字
      user_id: typeof values.user_id === 'number' ? values.user_id : Number(values.user_id),
      exam_id: typeof values.exam_id === 'number' ? values.exam_id : Number(values.exam_id),
      // 如果 score 为空或未定义，默认为 0
      score: values.score !== null && values.score !== undefined ? values.score : 0,
    };
    return formProps.onFinish?.(processed);
  };

  // 这里判断是否加载完成，避免组件内部访问未定义数据

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }
  return (
    <Edit saveButtonProps={saveButtonProps}>
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
            <Select onChange={(value) => setSelectedMode(value)}>
                <Select.Option value="exam">考试</Select.Option>
                <Select.Option value="practice">练习</Select.Option>
                <Select.Option value="review">复习</Select.Option>
                <Select.Option value="flashcard">FlashCard</Select.Option>
            </Select>
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
            >
                  <InputNumber style={{ width: "100%" }} min={1} placeholder="考试题目数量" />
            </Form.Item>
          </>
        )}
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
      </Form>

    </Edit>
  );
};