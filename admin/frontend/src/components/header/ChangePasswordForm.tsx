import React, { useState } from "react";
import { Form, Input, Button, Progress, message } from "antd";
import zxcvbn from "zxcvbn";

interface ChangePasswordFormProps {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [password, setPassword] = useState("");

  const testResult = zxcvbn(password);
  const strengthPercent = testResult.score * 25;

  const getPasswordStatus = () => {
    if (strengthPercent > 80) return "strong";
    if (strengthPercent > 50) return "medium";
    if (strengthPercent > 0) return "weak";
    return "empty";
  };

  const getPasswordStatusText = () => {
    switch (getPasswordStatus()) {
      case "strong":
        return "强";
      case "medium":
        return "中";
      case "weak":
        return "弱";
      default:
        return "请输入密码";
    }
  };

  const onFinish = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("两次输入的新密码不一致");
      return;
    }

    if (getPasswordStatus() === "empty") {
      message.error("密码强度不足");
      return;
    }

    try {
      await onSubmit(values.oldPassword, values.newPassword);
      message.success("密码修改成功");
      form.resetFields();
      setPassword("");
    } catch (error: any) {
      message.error(error.message || "修改密码失败");
    }
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical" style={{ maxWidth: 400 }}>
      <Form.Item
        label="旧密码"
        name="oldPassword"
        rules={[{ required: true, message: "请输入旧密码" }]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        label="新密码"
        name="newPassword"
        rules={[{ required: true, message: "请输入新密码" }]}
        hasFeedback
      >
        <Input.Password onChange={(e) => setPassword(e.target.value)} />
      </Form.Item>

      {password && (
        <div style={{ marginBottom: 24 }}>
          密码强度: {getPasswordStatusText()}
          <Progress
            percent={strengthPercent}
            status={
              getPasswordStatus() === "strong"
                ? "success"
                : getPasswordStatus() === "medium"
                ? "normal"
                : "exception"
            }
            showInfo={false}
          />
        </div>
      )}

      <Form.Item
        label="确认新密码"
        name="confirmPassword"
        dependencies={["newPassword"]}
        hasFeedback
        rules={[
          { required: true, message: "请确认新密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次输入的新密码不一致"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          修改密码
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ChangePasswordForm;
