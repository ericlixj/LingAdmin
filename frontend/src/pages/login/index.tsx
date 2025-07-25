import { useLogin, useTranslate } from "@refinedev/core";
import { Button, Card, Form, Input } from "antd";
import { AppIcon } from "../../components/app-icon";
import { LanguageSwitcher } from "../../components/header/LanguageSwitcher"; // ✅ 导入语言切换组件

export const Login = () => {
  const { mutate: login, isLoading } = useLogin();
  const t = useTranslate();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* ✅ 顶部语言切换按钮 */}
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <LanguageSwitcher />
      </div>

      {/* logo */}
      <div style={{ marginBottom: 24 }}>
        <AppIcon size={64} />
      </div>

      <Card title={t("login.title")} style={{ width: 320 }}>
        <Form
          layout="vertical"
          initialValues={{ email: "admin@kxf.ca", password: "admin123" }}
          onFinish={(values) => login(values)}
        >
          <Form.Item
            label={t("login.email")}
            name="email"
            rules={[{ required: true, message: t("login.email_required") }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t("login.password")}
            name="password"
            rules={[{ required: true, message: t("login.password_required") }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {t("login.submit")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
