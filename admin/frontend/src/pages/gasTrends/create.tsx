import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const GasTrendsCreate = () => {
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
          name="postcode"
          label="邮编"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="today_avg"
          label="进入平均"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="today_low"
          label="今日最低"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="trend"
          label="趋势（up, down, stable）"
          rules={[
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="crawl_time"
          label="爬取时间"
          rules={[
            
          ]}
        >
<DatePicker style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};