import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Spin, InputNumber, Image } from "antd";
import { useList } from "@refinedev/core";
import { getProxyImageUrl } from "../../utils/imageProxy";

const fields = [{"common": true, "default": null, "description": "pk", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "id", "nullable": false, "options": [], "primary_key": true, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "\u5173\u8054exam\u7684id", "form_type": "input", "index": false, "insertable": false, "listable": false, "max_length": null, "name": "exam_id", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "int", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "code", "form_type": "input", "index": true, "insertable": true, "listable": true, "max_length": 64, "name": "code", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": true, "updatable": true}, {"common": false, "default": "", "description": "\u6807\u9898", "form_type": "input", "index": false, "insertable": true, "listable": true, "max_length": 255, "name": "title", "nullable": false, "options": [], "primary_key": false, "query_type": "like", "queryable": true, "required": true, "sortable": false, "type": "str", "unique": false, "updatable": true}, {"common": false, "default": "", "description": "\u63cf\u8ff0", "form_type": "textarea", "index": false, "insertable": false, "listable": false, "max_length": 9999, "name": "description", "nullable": false, "options": [], "primary_key": false, "query_type": "eq", "queryable": false, "required": false, "sortable": false, "type": "str", "unique": false, "updatable": false}, {"common": false, "default": "", "description": "importance", "form_type": "select", "index": false, "insertable": true, "listable": true, "max_length": 32, "name": "importance", "nullable": false, "options": [{"label": "\u9ad8", "value": "high"}, {"label": "\u4e2d", "value": "mid"}, {"label": "\u4f4e", "value": "low"}], "primary_key": false, "query_type": "eq", "queryable": true, "required": true, "sortable": true, "type": "str", "unique": false, "updatable": true}];

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

export const StudyKnowledgeNodeEdit = () => {
  const { formProps, saveButtonProps, queryResult } = useForm();
  const [initialized, setInitialized] = useState(false);

  const record = queryResult?.data?.data;
  const form = formProps?.form;

  // 获取考试列表
  const { data: examsData, isLoading: examsLoading } = useList({
    resource: "studyExam",
    pagination: { pageSize: 1000 },
    filters: [{ field: "deleted", operator: "eq", value: false }],
  });

  // 考试选项
  const examOptions = useMemo(() => {
    return (examsData?.data || []).map((exam: any) => ({
      label: exam.name || `ID: ${exam.id}`,
      value: exam.id,
      searchText: `${exam.name || ''} ${exam.code || ''} ${exam.id}`,
    }));
  }, [examsData]);

  useEffect(() => {
    if (!initialized && record && form && !form.isFieldsTouched()) {
      form.setFieldsValue(prepareInitialValues(record, fields));
      setInitialized(true);
    }
  }, [initialized, queryResult?.data?.data]);

  const handleFinish = (values: any) => {
    const processed = {
      ...values,
      // 确保 exam_id 是数字
      exam_id: typeof values.exam_id === 'number' ? values.exam_id : (values.exam_id ? Number(values.exam_id) : null),
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
          name="exam_id"
          label="关联exam"
          rules={[
            { type: "number", message: "必须是数字" }
          ]}
        >
          <Select
            style={{ width: "100%" }}
            placeholder="选择考试..."
            options={examOptions}
            showSearch
            filterOption={(input, option) =>
              (option?.searchText ?? "").toLowerCase().includes(input.toLowerCase())
            }
            loading={examsLoading}
            notFoundContent={examsLoading ? <Spin size="small" /> : "暂无数据"}
            onChange={(value) => {
              formProps.form?.setFieldsValue({ exam_id: value ? Number(value) : null });
            }}
          />
        </Form.Item>
        <Form.Item
          name="code"
          label="code"
          rules={[
            { required: true, message: '请输入code' },
            { max: 64, message: '最多输入 64 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="title"
          label="标题"
          rules={[
            { required: true, message: '请输入标题' },
            { max: 255, message: '最多输入 255 个字符' }
          ]}
        >
              <Input />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[
            { max: 9999, message: '最多输入 9999 个字符' }
          ]}
        >
            <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="importance"
          label="importance"
          rules={[
            { required: true, message: '请输入importance' },
            { max: 32, message: '最多输入 32 个字符' }
          ]}
        >
            <Select>
                <Select.Option value="high">高</Select.Option>
                <Select.Option value="mid">中</Select.Option>
                <Select.Option value="low">低</Select.Option>
            </Select>
        </Form.Item>
        <Form.Item
          name="image_url"
          label="图片URL"
          rules={[
            { max: 500, message: '最多输入 500 个字符' },
            { type: "url", message: "请输入有效的URL" }
          ]}
        >
          <Input placeholder="请输入图片URL" />
        </Form.Item>
        {record?.image_url && (
          <Form.Item label="图片预览">
            <Image
              src={getProxyImageUrl(record.image_url)}
              alt={record?.title || "知识点图片"}
              style={{ maxWidth: "300px", maxHeight: "300px" }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvqVx1emZM3FeB9T4llBQV4nFictyt5PwDxepNyUV4MwHjCy0pElBsVe8dA1HfRg8I7HhCwB3IewG5QfEaInALkOgB3QL2FyBYiBkD6AqwiwG3gQ6AKhFhCfC7MQk3MQk7aHhTeBB4X3haDPCcUZBYlq3q2DxLBUktUKHpvKXpJaBYnfxGrFwM0t7cyFXJTspXUO+HYwrspjJChgOGEpVaxSYWHQKA4L1damfM9LwygU9bKwg+pX1PAcfeh4nB2BiQWHRFgMD0eEDPXcGYFjzJwPBYLWhNPjBxTrtwsFNgUFi5LbWD8UxPSlGRoY9hTgPDvYJACxK1Gu8pvAsv0jwB/yzE4Ftgf8aQ4MAbvW4Bx75jMPjKe78b28H///fHMzA/v+u499gPzfmYH5+B3n4HpD4jQH8Kvz3YW5joR8B8O9E8P8I8L//+xf4//9PzQwM/w4A8fwJ7XqjjskdY2IAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
            />
            <div style={{ marginTop: "8px" }}>
              <a href={record.image_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px" }}>
                在新窗口打开原图
              </a>
            </div>
          </Form.Item>
        )}
      </Form>

    </Edit>
  );
};