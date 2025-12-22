import { useForm } from "@refinedev/antd";
import { useList, useMany } from "@refinedev/core";
import { Form, Input, Select, Switch, Button, InputNumber, Spin } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";

interface StudySessionItemProps {
  session_id: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StudySessionItem = ({
  session_id,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: StudySessionItemProps) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "studySessionItem",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      session_id: Number(session_id),
      response: "",
      time_spent_second: 0,
      is_correct: false,
    },
    onMutationSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // 获取学习项目列表
  const { data: learningItemsData, isLoading: learningItemsLoading } = useList({
    resource: "studyLearningItem",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 收集所有关联的实体ID
  const learningItems = learningItemsData?.data || [];
  const knowledgeIds = learningItems
    .filter((item: any) => item.type === "knowledge")
    .map((item: any) => item.ref_id)
    .filter(Boolean);
  const questionIds = learningItems
    .filter((item: any) => item.type === "question")
    .map((item: any) => item.ref_id)
    .filter(Boolean);

  // 批量获取知识点
  const { data: knowledgeData } = useMany({
    resource: "studyKnowledgeNode",
    ids: knowledgeIds as number[],
    queryOptions: {
      enabled: knowledgeIds.length > 0,
    },
  });

  // 批量获取题目
  const { data: questionData } = useMany({
    resource: "studyQuestion",
    ids: questionIds as number[],
    queryOptions: {
      enabled: questionIds.length > 0,
    },
  });

  // 构建实体映射
  const knowledgeMap = useMemo(() => {
    const map = new Map();
    (knowledgeData?.data || []).forEach((kn: any) => {
      map.set(kn.id, kn);
    });
    return map;
  }, [knowledgeData]);

  const questionMap = useMemo(() => {
    const map = new Map();
    (questionData?.data || []).forEach((q: any) => {
      map.set(q.id, q);
    });
    return map;
  }, [questionData]);

  // 构建学习项目选项
  const learningItemOptions = useMemo(() => {
    return learningItems.map((item: any) => {
      let label = "";
      if (item.type === "knowledge") {
        const kn = knowledgeMap.get(item.ref_id);
        label = kn ? kn.title : `知识点 #${item.ref_id}`;
      } else if (item.type === "question") {
        const q = questionMap.get(item.ref_id);
        if (q) {
          const stem = q.stem || "";
          const cleanStem = stem.replace(/\n?\[IMAGE:.*?\]/, '').trim();
          label = cleanStem.length > 50 ? cleanStem.substring(0, 50) + "..." : cleanStem;
        } else {
          label = `题目 #${item.ref_id}`;
        }
      } else {
        label = `ID: ${item.id}`;
      }
      return {
        label: `${item.type === "knowledge" ? "📚" : "📝"} ${label}`,
        value: item.id,
        searchText: `${item.type} ${label} ${item.id}`,
      };
    });
  }, [learningItems, knowledgeMap, questionMap]);

  useEffect(() => {
    if (isEdit && initialValues) {
      formProps.form?.setFieldsValue({
        ...initialValues,
        // 确保 is_correct 是布尔值（0/1 转换为 false/true）
        is_correct: initialValues.is_correct === 1 || initialValues.is_correct === true,
      });
    } else {
      // 新建时设置默认值
      formProps.form?.setFieldsValue({
        is_correct: false,
        response: "",
        time_spent_second: 0,
      });
    }
  }, [isEdit, initialValues, form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 将 is_correct 转换为 0/1
      is_correct: values.is_correct ? 1 : 0,
      // 确保 response 是空字符串（如果未填写）
      response: values.response || "",
      // 确保 time_spent_second 是数字（默认为0）
      time_spent_second: values.time_spent_second ?? 0,
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Form {...formProps} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="session_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="learning_item_id"
        label="学习内容"
        rules={[
          { required: true, message: "请选择学习内容" }
        ]}
      >
        <Select
          style={{ width: "100%" }}
          placeholder="选择学习内容..."
          options={learningItemOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.searchText ?? "").toLowerCase().includes(input.toLowerCase())
          }
          loading={learningItemsLoading}
          notFoundContent={learningItemsLoading ? <Spin size="small" /> : "暂无数据"}
          onChange={(value) => {
            formProps.form?.setFieldsValue({ learning_item_id: Number(value) });
          }}
        />
      </Form.Item>
      <Form.Item
        name="is_correct"
        label="是否正确"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch checkedChildren="是" unCheckedChildren="否" />
      </Form.Item>
      <Form.Item
        name="response"
        label="用户做答内容"
        initialValue=""
        rules={[
          { max: 255, message: '最多输入 255 个字符' },  
        ]}
      >
        <Input placeholder="用户作答内容（可选）" />
      </Form.Item>
      <Form.Item
        name="time_spent_second"
        label="耗时秒"
        initialValue={0}
        rules={[
          { type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} min={0} placeholder="耗时（秒）" />
      </Form.Item>

      <Form.Item style={{ textAlign: "right" }}>
        <Button
          type="primary"
          onClick={() => form.submit()}
          loading={saveButtonProps.loading}
        >
          {isEdit ? "保存修改" : "保存"}
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          取消
        </Button>
      </Form.Item>
    </Form>
  );
};