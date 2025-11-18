import { useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, DatePicker, Button } from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";

interface CrudDefineFiledsProps {
  module_id: number | string;
  initialValues?: any;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CrudDefineFileds = ({
  module_id,
  initialValues,
  isEdit = false,
  onSuccess,
  onCancel,
}: CrudDefineFiledsProps) => {
  const {
    formProps,
    saveButtonProps,
    form,
  } = useForm({
    resource: "crudDefineFileds",
    action: isEdit ? "edit" : "create",
    id: initialValues?.id,
    redirect: false,
    defaultFormValues: {
      module_id: Number(module_id),
    },
    onMutationSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  useEffect(() => {
    if (isEdit && initialValues) {
      form.setFieldsValue(initialValues);
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
      <Form.Item name="module_id" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Form.Item
        name="name"
        label="字段名"
        rules={[
{ required: true, message: '请输入字段名' },        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="type"
        label="字段类型"
        rules={[
{ max: 50, message: '最多输入 50 个字符' },        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                "str"
            }
          >
            字符串
          </Select.Option>
          <Select.Option
            value={
                "int"
            }
          >
            整数
          </Select.Option>
          <Select.Option
            value={
                "datetime"
            }
          >
            日期
          </Select.Option>
          <Select.Option
            value={
                "bool"
            }
          >
            BOOL类型
          </Select.Option>          
        </Select>
      </Form.Item>
      <Form.Item
        name="primary_key"
        label="是否为主键"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="description"
        label="描述"
        rules={[
{ required: true, message: '请输入描述' },{ max: 255, message: '最多输入 255 个字符' },        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="form_type"
        label="表单类型"
        rules={[
{ max: 50, message: '最多输入 50 个字符' },        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                "input"
            }
          >
            文本框
          </Select.Option>
          <Select.Option
            value={
                "textarea"
            }
          >
            文本块
          </Select.Option>
          <Select.Option
            value={
                "checkbox"
            }
          >
            复选框
          </Select.Option>
          <Select.Option
            value={
                "select"
            }
          >
            下拉框
          </Select.Option>
          <Select.Option
            value={
                "date"
            }
          >
            日期选择框
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="options"
        label="备选值"
        rules={[
{ max: 1024, message: '最多输入 1024 个字符' },        ]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item
        name="max_length"
        label="最大长度"
        rules={[
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="default"
        label="默认值"
        rules={[
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="required"
        label="是否必填"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="insertable"
        label="是否可插入"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="updatable"
        label="是否可更新"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="listable"
        label="是否可列表"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="queryable"
        label="是否可查询"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="query_type"
        label="查询类型"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                "eq"
            }
          >
            等于
          </Select.Option>
          <Select.Option
            value={
                "like"
            }
          >
            包含
          </Select.Option>
          <Select.Option
            value={
                "in"
            }
          >
            在范围内
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="sortable"
        label="是否可排序"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="nullable"
        label="是否可为空"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="unique"
        label="是否建立唯一索引"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="index"
        label="是否建立索引"
        rules={[
        ]}
      >
        <Select allowClear>
          <Select.Option
            value={
                true
            }
          >
            是
          </Select.Option>
          <Select.Option
            value={
                false
            }
          >
            否
          </Select.Option>
        </Select>
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