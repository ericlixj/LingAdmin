import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const SalePredictCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
      stat_year:"2025",
      stat_month:"1",
      sales_quantity:"0",
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
          name="stat_year"
          label="统计年"
          rules={[
            { required: true, message: '请输入统计年' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="stat_month"
          label="统计月"
          rules={[
            { required: true, message: '请输入统计月' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="sku"
          label="sku"
          rules={[
            { required: true, message: '请输入sku' },
            { max: 20, message: '最多输入 20 个字符' }
          ]}
        >
              <Input />
        </Form.Item>        
        <Form.Item
          name="sales_quantity"
          label="实际销量"
          rules={[
            { required: true, message: '请输入实际销量' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>        
        <Form.Item
          name="predict_quantity"
          label="预测销量"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Create>
  );
};