import { Modal } from "antd";
import { useState } from "react";
import { MCP_KEY } from "../authProvider";
import ChangePasswordForm from "./header/ChangePasswordForm";
import axiosInstance from "../utils/axiosInstance";
import { useLogout } from "@refinedev/core";

export const MustChangePasswordModal = () => {
  const [mustChangePassword, setMustChangePassword] = useState(
    () => localStorage.getItem(MCP_KEY) === "true"
  );
  const { mutate: logout } = useLogout();

  if (!mustChangePassword) return null;

  return (
    <Modal
      open
      title="请先修改密码"
      footer={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      centered
      width={480}
    >
      <ChangePasswordForm
        onSubmit={async (oldPassword, newPassword) => {
          await axiosInstance.patch(`/user/0/change-password`, {
            oldPassword,
            newPassword,
          });
          setMustChangePassword(false);
          localStorage.removeItem(MCP_KEY);
          logout();
        }}
      />
    </Modal>
  );
};
