import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const GasStationCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
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
          name="station_id"
          label="加油站标识"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="distance"
          label="从搜索postcode到station距离,km"
          rules={[
            { max: 10, message: '最多输入 10 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="postcode"
          label="基准postcode"
          rules={[
            { required: true, message: '请输入基准postcode' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="address"
          label="地址"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};