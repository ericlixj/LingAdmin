import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, InputNumber } from "antd";
import { useEffect } from "react";

export const SysDicData001Create = () => {
  const { formProps, saveButtonProps } = useForm();

  useEffect(() => {
    const defaults = {
      status:"0",
      orderby:"0",
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
          name="sys_dic_id"
          label="外键"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="label"
          label="字典标签"
          rules={[
            { required: true, message: '请输入字典标签' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="value"
          label="字典键值"
          rules={[
            { required: true, message: '请输入字典键值' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="status"
          label="状态"
          rules={[
            { required: true, message: '请输入状态' }
          ]}
        >
          <Select
            options={[
                { label: "开启", value: "0" },                { label: "关闭", value: "1" }            ]}
          />

        </Form.Item>
        <Form.Item
          name="orderby"
          label="展示排序号【正序】"
          rules={[
            { required: true, message: '请输入展示排序号【正序】' },
            { type: "number", message: "必须是数字" }
          ]}
        >
              <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="remark"
          label="备注"
          rules={[
            { max: 200, message: '最多输入 200 个字符' }
          ]}
        >
          <Input.TextArea rows={4} />

        </Form.Item>
      </Form>
    </Create>
  );
};