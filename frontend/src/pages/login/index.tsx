import { useLogin } from "@refinedev/core";
import { Button, Card, Form, Input } from "antd";
import { AppIcon } from "../../components/app-icon";

export const Login = () => {
  const { mutate: login, isLoading } = useLogin();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
    }}>
      {/* logo */}
      <div style={{ marginBottom: 24 }}>
        <AppIcon size={64}/>
      </div>

      <Card title="LingAdmin" style={{ width: 320 }}>
        <Form
          layout="vertical"
          initialValues={{ email: "admin@kxf.ca", password: "admin123" }}
          onFinish={(values) => login(values)}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ required: true, message: "请输入注册邮箱" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
