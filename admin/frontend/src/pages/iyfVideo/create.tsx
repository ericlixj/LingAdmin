import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const IyfVideoCreate = () => {
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
          name="iyf_id"
          label="IYF 平台 ID"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="名称"
          rules={[
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="cover_url"
          label="封面图片"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="简介"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="category"
          label="类型"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="year"
          label="年份"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="region"
          label="地区"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="rating"
          label="评分"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="view_count"
          label="播放量"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="crawl_date"
          label="爬取时间"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
      </Form>
    </Create>
  );
};