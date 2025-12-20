import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button, InputNumber } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

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
    },
    onMutationSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  useEffect(() => {
    if (isEdit && initialValues) {
      formProps.form?.setFieldsValue({
        ...initialValues,
      });
    }
  }, [isEdit, initialValues, form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
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
        label="learning_item_id"
        rules={[
{ type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="is_correct"
        label="is_correct"
        rules={[
{ max: 2, message: '最多输入 2 个字符' },{ type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="response"
        label="用户做答内容"
        rules={[
{ max: 255, message: '最多输入 255 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="time_spent_second"
        label="耗时秒"
        rules={[
{ type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} />
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