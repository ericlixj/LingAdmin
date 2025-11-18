import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button, InputNumber } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

interface FlyerDetailsProps {
  flyer_id: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const FlyerDetails = ({
  flyer_id,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: FlyerDetailsProps) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "flyerDetails",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      flyer_id: Number(flyer_id),
    },
    onMutationSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  useEffect(() => {
    if (isEdit && initialValues) {
      formProps.form?.setFieldsValue({
        ...initialValues,
        valid_from: initialValues.valid_from ? dayjs(initialValues.valid_from) : undefined,
        valid_to: initialValues.valid_to ? dayjs(initialValues.valid_to) : undefined,
        available_to: initialValues.available_to ? dayjs(initialValues.available_to) : undefined,
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
      <Form.Item name="flyer_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="item_id"
        label="ItemID"
        rules={[
{ type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="name"
        label="名称"
        rules={[
{ max: 250, message: '最多输入 250 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="brand"
        label="品牌"
        rules={[
{ max: 100, message: '最多输入 100 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="valid_from" label="开始有效期">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="valid_to" label="结束有效期">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="available_to" label="截至有效期">
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="cutout_image_url"
        label="图片地址"
        rules={[
{ max: 100, message: '最多输入 100 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="price"
        label="价格"
        rules={[
{ max: 10, message: '最多输入 10 个字符' },  
        ]}
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