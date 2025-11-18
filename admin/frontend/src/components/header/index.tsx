import type { RefineThemedLayoutV2HeaderProps } from "@refinedev/antd";
import { useGetIdentity } from "@refinedev/core";
import {
  Avatar,
  Layout as AntdLayout,
  Space,
  Switch,
  theme,
  Typography,
  Dropdown, 
  Menu,
  Modal,
  Tabs,
  message,
} from "antd";
import React, { useContext, useState  } from "react";
import { ColorModeContext } from "../../contexts/color-mode";
import { LanguageSwitcher } from "../header/LanguageSwitcher";
import { useLogout } from "@refinedev/core";
import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useTranslate } from "@refinedev/core";
import {UserDetail} from "../../types/user"
import axiosInstance from "../../utils/axiosInstance";
import ChangePasswordForm from "./ChangePasswordForm";
import {MCP_KEY} from "../../authProvider"

const { Text } = Typography;
const { useToken } = theme;
const { TabPane } = Tabs;

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const t = useTranslate();
  const { token } = useToken();
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [activeTabKey, setActiveTabKey] = useState<"1" | "2">("1"); // 1=个人信息，2=修改密码
  const fetchUserDetail = async () => {
    try {
      const res = await axiosInstance.get("/me");
      setUserDetail(res.data);
    } catch (error) {
      console.error("获取用户信息失败", error);
    }
  };

  const onMenuClick = async ({ key }: { key: string }) => {
    setModalVisible(true);
    if (key === "profile") {
      await fetchUserDetail();
      setActiveTabKey("1");
    } else if (key === "changePwd") {
      setActiveTabKey("2");
    }
  };
  const items = [
    {
      key: "profile",
      label: "个人中心",
    },
    {
      key: "changePwd",
      label: "修改密码",
    },
  ]; 
  

  const headerStyles: React.CSSProperties = {
    backgroundColor: token.colorBgElevated,
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  const { mutate: logout } = useLogout();

  const handleChangePassword = async (userId: number, oldPassword: string, newPassword: string) => {
    try {
      await axiosInstance.patch(`/user/${userId}/change-password`, {
        oldPassword,
        newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "修改密码失败");
    }
  };

  return (
    <AntdLayout.Header style={headerStyles}>
      <Space>
        <Switch
          checkedChildren="🌛"
          unCheckedChildren="🔆"
          onChange={() => setMode(mode === "light" ? "dark" : "light")}
          defaultChecked={mode === "dark"}
        />

        <LanguageSwitcher />

        <Dropdown
          menu={{
            items,
            onClick: onMenuClick,
          }}
          placement="bottomRight"
          trigger={["click"]}
          >
          <Space style={{ marginLeft: "8px", cursor: "pointer" }} size="middle">
            {user?.name && <Text strong>{user.name}</Text>}
            {user?.avatar && <Avatar src={user?.avatar} alt={user?.name} />}
          </Space>
        </Dropdown>

        <Button icon={<LogoutOutlined />} onClick={() => logout()}>
            {t("buttons.logout", "登出")}
        </Button>
      </Space>

      {/* 弹出层 */}
      <Modal
        title="个人中心"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
        width={600}
      >
        <Tabs activeKey={activeTabKey} onChange={(key) => setActiveTabKey(key as "1" | "2")}>
          <Tabs.TabPane tab="个人信息" key="1">
            <div>
              <p>
                <b>邮箱：</b> {user?.email ?? "-"}
              </p>
              <p>
                <b>姓名：</b> {user?.name ?? "-"}
              </p>
              <p>
                <b>创建日期：</b>{" "}
                {user?.create_time
                  ? new Date(user.create_time).toLocaleString()
                  : "-"}
              </p>
              <p>
                <b>所属部门：</b> {user?.dept_name ?? "-"}
              </p>
              <p>
                <b>分配的角色：</b>{" "}
                {user?.roles && user.roles.length > 0
                  ? user.roles.map((r: any) => r.name).join(", ")
                  : "-"}
              </p>
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="修改密码" key="2">
            <ChangePasswordForm
              onSubmit={async (oldPassword, newPassword) => {
                if (!user?.id) {
                  message.error("用户未登录");
                  return;
                }
                await handleChangePassword(user.id, oldPassword, newPassword);
              }}
              onSuccess={() => {
                setModalVisible(false);
                localStorage.removeItem(MCP_KEY);
                message.success("密码修改成功！");
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>      
    </AntdLayout.Header>
  );
};
