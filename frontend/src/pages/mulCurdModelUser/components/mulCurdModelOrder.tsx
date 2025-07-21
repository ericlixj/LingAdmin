import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button } from "antd";
import dayjs from "dayjs";

interface MulCurdModelOrderProps {
  userId: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const MulCurdModelOrder = ({
  userId,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: MulCurdModelOrderProps) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "mulCurdModelOrder",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      user_id: Number(userId),
    },
    onMutationSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  // 预填初始值（支持编辑场景）
  if (isEdit && initialValues) {
    formProps.form?.setFieldsValue({
      ...initialValues,
      open_date: initialValues.open_date ? dayjs(initialValues.open_date) : undefined,
      open_function: initialValues.open_function?.split(",").map(Number),
    });
  }

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      open_function: (values.open_function || []).join(","),
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Form {...formProps} layout="vertical" onFinish={handleFinish}>
      <Form.Item name="user_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="order_code"
        label="订单编码"
        rules={[
          { required: true, message: '请输入订单编码' },
          { max: 50, message: '最多输入 50 个字符' },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="open_date" label="开启日期">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item
        name="order_status"
        label="订单状态"
        rules={[{ max: 128, message: '最多输入 128 个字符' }]}
      >
        <Select allowClear>
          <Select.Option value="enabled">启用</Select.Option>
          <Select.Option value="disabled">停用</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="open_function" label="开启功能">
        <Checkbox.Group
          options={[
            { label: "功能A", value: 1 },
            { label: "功能B", value: 2 },
            { label: "功能C", value: 3 },
          ]}
        />
      </Form.Item>

      <Form.Item
        name="order_info"
        label="订单信息"
        rules={[{ max: 255, message: '最多输入 255 个字符' }]}
      >
        <Input.TextArea rows={4} />
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
