import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button, InputNumber } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

interface Sub001Props {
  sys_dic_id: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const Sub001 = ({
  sys_dic_id,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: Sub001Props) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "sub001",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      sys_dic_id: Number(sys_dic_id),
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
      <Form.Item name="sys_dic_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="label"
        label="字典标签"
        rules={[
{ required: true, message: '请输入字典标签' },{ max: 50, message: '最多输入 50 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="value"
        label="字典键值"
        rules={[
{ required: true, message: '请输入字典键值' },{ max: 50, message: '最多输入 50 个字符' },  
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="status"
        label="状态"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                0
            }
          >
            开启
          </Select.Option>
          <Select.Option
            value={
                1
            }
          >
            关闭
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="orderby"
        label="展示排序号【正序】"
        rules={[
{ required: true, message: '请输入展示排序号【正序】' },{ type: "number", message: "必须是数字" },  
        ]}
      >
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item
        name="remark"
        label="备注"
        rules={[
{ max: 200, message: '最多输入 200 个字符' },        ]}
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