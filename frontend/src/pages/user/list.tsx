import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList, useTranslate, useUpdate } from "@refinedev/core";
import { Button, Checkbox, Input, Modal, Space, Table, Tag, message } from "antd";
import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export const UserList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  const { data: roleData } = useList({ resource: "role" });
  const { mutate: updateUserRoles } = useUpdate();
  const t = useTranslate();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const openRoleModal = async (userId: number) => {
    setSelectedUserId(userId);
    setLoading(true);
    const ids = await fetchBoundRoles(userId);
    setSelectedRoleIds(ids);
    setLoading(false);
    setModalVisible(true);
  };

  const fetchBoundRoles = async (userId: number) => {
    const response = await axiosInstance.get(`/user/bind-roles/${userId}`);
    return response.data as number[];
  };

  const handleRoleChange = (checkedValues: any) => {
    setSelectedRoleIds(checkedValues);
  };

  const handleBindRoles = () => {
    if (selectedUserId !== null) {
      updateUserRoles({
        resource: `user/bind-roles`,
        values: {
          role_ids: selectedRoleIds,
        },
        id: selectedUserId,
      });
    }
    setModalVisible(false);
    setSelectedRoleIds([]);
  };
  // 重置密码相关状态和函数
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [resetPwdLoading, setResetPwdLoading] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");  

  const openResetPwdModal = (userId: number) => {
    setResetUserId(userId);
    setNewPassword("");
    setResetPwdModalVisible(true);
  };
  const handleResetPwd = async () => {
    if (!newPassword || !resetUserId) {
      message.error("请输入新密码");
      return;
    }
    setResetPwdLoading(true);
    try {
      await axiosInstance.patch(`/user/${resetUserId}/reset-password`, {
        password: newPassword,
      });
      message.success("修改成功");
      setResetPwdModalVisible(false);
    } catch (error) {
      message.error("修改失败，请重试");
    } finally {
      setResetPwdLoading(false);
    }
  };

  return (
    <List title={t("user.titles.list")}>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />

        <Table.Column
          dataIndex="email"
          title={t("user.fields.email")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.email")}
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "email")?.value as string[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="full_name"
          title={t("user.fields.full_name")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.full_name")}
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "full_name")?.value as string[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="dept_name"  // 假设后端返回的用户数据里有 dept_name 字段
          title={t("user.fields.dept")}
          sorter
          render={(value: string | undefined) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("user.filters.dept")}
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "dept_name")?.value as string[]) || null
          }
        />        

        <Table.Column
          dataIndex="is_active"
          title={t("user.fields.is_active")}
          render={(value) =>
            value ? (
              <Tag color="green">{t("common.enums.yes")}</Tag>
            ) : (
              <Tag color="red">{t("common.enums.no")}</Tag>
            )
          }
        />
        <Table.Column
          dataIndex="create_time"
          title={t("user.fields.create_time")}
        />
        <Table.Column
          title={t("user.actions.title")}
          render={(_, record) => (
            <Space>
              <EditButton
                recordItemId={record.id}
                disabled={record.is_superuser}
              />
              <ShowButton recordItemId={record.id} />
              <Button
                onClick={() => openRoleModal(record.id)}
                disabled={record.is_superuser}
              >
                {t("user.actions.bind_roles")}
              </Button>
              <Button
                onClick={() => openResetPwdModal(record.id)}
              >
                {t("user.actions.reset_pwd")}
              </Button>              
            </Space>
          )}
        />
      </Table>

      <Modal
        title={t("user.modal.title")}
        open={modalVisible}
        onOk={handleBindRoles}
        onCancel={() => setModalVisible(false)}
        okText={t("user.modal.ok")}
        cancelText={t("user.modal.cancel")}
      >
        <Checkbox.Group
          style={{ width: "100%" }}
          onChange={handleRoleChange}
          value={selectedRoleIds}
        >
          <Space direction="vertical">
            {roleData?.data.map((role: any) => (
              <Checkbox key={role.id} value={role.id}>
                {role.name}（{role.code}）
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Modal>
      <Modal
        title="重置密码"
        open={resetPwdModalVisible}
        onOk={handleResetPwd}
        onCancel={() => setResetPwdModalVisible(false)}
        okText="提交"
        cancelText="取消"
        confirmLoading={resetPwdLoading}
      >
        <Input.Password
          placeholder="请输入新密码"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>      
    </List>
  );
};
