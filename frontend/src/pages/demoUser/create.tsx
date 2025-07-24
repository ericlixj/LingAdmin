import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const DemoUserCreate = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
      gender:"0",
      gender2:"unknown",
    };
    formProps.form?.setFieldsValue(defaults);
  }, [formProps.form]);  

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      hobby2: (values.hobby2 || []).join(","),
      hobby: (values.hobby || []).join(","),
    };
    return formProps.onFinish?.(processed);
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="age"
          label="年龄"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="gender"
          label="性别"
          rules={[
            
          ]}
        >
          <Select
            options={[
                { label: "未知", value: "0" },                { label: "男", value: "1" },                { label: "女", value: "2" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[
            { max: 1000, message: '最多输入 1000 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
        <Form.Item
          name="birth_day"
          label="生日"
          rules={[
            { required: true, message: '请输入生日' }
          ]}
        >
<DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="hobby2"
          label="爱好2"
          rules={[
            
          ]}
        >
          <Checkbox.Group
            options={[
                { label: "阅读", value: "1" },                 { label: "旅行", value: "2" },                 { label: "音乐", value: "3" },                 { label: "运动", value: "4" },                 { label: "摄影", value: "5" },                 { label: "绘画", value: "6" },                 { label: "烹饪", value: "7" },                 { label: "电影", value: "8" },                 { label: "游戏", value: "9" },                 { label: "写作", value: "10" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="hobby"
          label="爱好"
          rules={[
            
          ]}
        >
          <Checkbox.Group
            options={[
                { label: "阅读", value: "reading" },                 { label: "旅行", value: "travel" },                 { label: "音乐", value: "music" },                 { label: "运动", value: "sports" },                 { label: "摄影", value: "photography" },                 { label: "绘画", value: "painting" },                 { label: "烹饪", value: "cooking" },                 { label: "电影", value: "movies" },                 { label: "游戏", value: "gaming" },                 { label: "写作", value: "writing" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="gender2"
          label="性别2"
          rules={[
            { required: true, message: '请输入性别2' }
          ]}
        >
          <Select
            options={[
                { label: "未知", value: "unknown" },                { label: "男", value: "man" },                { label: "女", value: "women" }            ]}
          />

        </Form.Item>
      </Form>
    </Create>
  );
};