import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber } from "antd";


const fields = [{"common": true, "default": null, "description": "\u4e3b\u952e", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 100, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u4ea7\u54c1ID", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 100, "name": "productId", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "SKUID", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 50, "name": "skuId", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u4ea7\u54c1\u540d\u79f0", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 100, "name": "productName", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u4ef7\u683c", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 20, "name": "listPrice", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u89c4\u683c", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "variationType", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u89c4\u683c\u540d\u79f0", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 100, "name": "variationTypeDisplayName", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u89c4\u683c\u503c", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": 100, "name": "variationValue", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u56fe\u7247", "form_type": "textarea", "index": false, "insertable": true, "listable": true, "max_length": 10000, "name": "images", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": true}];

function prepareInitialValues(record: Record<string, any>, fields: any[]) {
  const result: Record<string, any> = {};
  fields.forEach((field) => {
    const value = record[field.name];
    if (field.form_type === "date") {
      result[field.name] = value ? dayjs(value) : null;
    } else if (field.form_type === "checkbox" && field.options) {
      result[field.name] = value ? value.split(",").map((v: string) => v.trim()) : [];
    } else if (field.form_type === "select") {
      result[field.name] = String(value);
    } else {
      result[field.name] = value;
    }
  });
  return result;
}

const ImagePreview: React.FC<{ value?: string }> = ({ value }) => {
  if (!value) return null;

  let images: { image250: string; altText: string }[] = [];
  try {
    images = JSON.parse(value);
  } catch (err) {
    return <span>JSON 格式错误</span>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img.image250}
          alt={img.altText}
          style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4 }}
        />
      ))}
    </div>
  );
};

export const Product4SephoraEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);

  const record = queryResult?.data?.data;
  const form = formProps?.form;
  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      form.setFieldsValue(prepareInitialValues(record, fields));
      setInitialized(true);
    }
  }, [initialized, queryResult?.data?.data]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
    };
    return formProps.onFinish?.(processed);
  };

  // 这里判断是否加载完成，避免组件内部访问未定义数据

  if (queryResult?.isLoading || !record || !form || !initialized) {
    return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  }
  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="productId"
          label="产品ID"
          rules={[
            { required: true, message: '请输入产品ID' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="skuId"
          label="SKUID"
          rules={[
            { required: true, message: '请输入SKUID' },
            { max: 50, message: '最多输入 50 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="productName"
          label="产品名称"
          rules={[
            { required: true, message: '请输入产品名称' },
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="listPrice"
          label="价格"
          rules={[
            { required: true, message: '请输入价格' },
            { max: 20, message: '最多输入 20 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationType"
          label="规格"
          rules={[
            
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationTypeDisplayName"
          label="规格名称"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="variationValue"
          label="规格值"
          rules={[
            { max: 100, message: '最多输入 100 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item label="图片" shouldUpdate>
          {() => <ImagePreview value={formProps?.form?.getFieldValue("images")} />}
        </Form.Item>
      </Form>

    </Edit>
  );
};