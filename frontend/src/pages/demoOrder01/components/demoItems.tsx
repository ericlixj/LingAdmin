import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

interface DemoItemsProps {
  order_id: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DemoItems = ({
  order_id,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: DemoItemsProps) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "demoItems",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      order_id: Number(order_id),
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
      <Form.Item name="order_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="name"
        label="名称"
        rules={[
{ required: true, message: '请输入名称' },{ max: 255, message: '最多输入 255 个字符' },        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="price"
        label="价格"
        rules={[
{ required: true, message: '请输入价格' },        ]}
      >
        <Input />
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