import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export const ShopDailyStatEdit = () => {
  const { formProps, saveButtonProps } = useForm({
    
  });


  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          name="shop_id"
          label="店铺编码"
          rules={[{ required: true, message: "请输入店铺编码" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="year"
          label="年份"
          rules={[{ required: true, message: "请输入年份" }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="month"
          label="月份"
          rules={[{ required: true, message: "请输入月份" }]}
        >
          <InputNumber min={1} max={12} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="day"
          label="日期"
          rules={[{ required: true, message: "请输入日期" }]}
        >
          <InputNumber min={1} max={31} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="pv" label="PV">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="uv" label="UV">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="sales_volume" label="销量">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="sales_amount" label="销售金额">
          <InputNumber min={0} precision={2} style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
