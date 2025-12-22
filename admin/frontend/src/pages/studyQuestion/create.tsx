import { Create, useForm } from "@refinedev/antd";
import { useList } from "@refinedev/core";
import { Form, Input, Select, InputNumber } from "antd";
import { useEffect } from "react";

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

export const StudyQuestionCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  // 获取考试列表
  const { data: examData } = useList({
    resource: "studyExam",
    pagination: { pageSize: 100 },
  });

  useEffect(() => {
    const defaults = {
      status: 1, // 默认开启
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
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
          <Input.TextArea rows={4} placeholder="请输入题目内容" />
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
          extra="单选填 A/B/C/D，多选填数组如 [A, B]"
        >
          <Input placeholder="A" />
        </Form.Item>

        <Form.Item
          name="explanation_raw"
          label="官方解释"
          rules={[{ max: 9999, message: "最多输入 9999 个字符" }]}
        >
          <Input.TextArea rows={4} placeholder="官方解释内容" />
        </Form.Item>

        <Form.Item
          name="explanation_human"
          label="通俗解释"
          rules={[{ max: 9999, message: "最多输入 9999 个字符" }]}
        >
          <Input.TextArea rows={4} placeholder="通俗易懂的解释" />
        </Form.Item>

        <Form.Item
          name="image_url"
          label="题目图片URL"
          rules={[{ max: 500, message: "最多输入 500 个字符" }]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: "请选择状态" }]}
        >
          <Select placeholder="请选择状态" options={STATUS_OPTIONS} />
        </Form.Item>
      </Form>
    </Create>
  );
};
