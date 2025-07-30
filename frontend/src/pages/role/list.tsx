import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList, useUpdate, useTranslate } from "@refinedev/core";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Space,
  Table,
} from "antd";
import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export const RoleList = () => {
  const t = useTranslate();

  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const { data: permissionData } = useList({ resource: "permission" });
  const { mutate: updateRolePermissions } = useUpdate();
  const [boundIds, setBoundIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const openPermissionModal = async (roleId: number) => {
    setSelectedRoleId(roleId);
    setLoading(true);
    const ids = await fetchBoundPermissions(roleId);
    setBoundIds(ids);
    setSelectedPermissionIds(ids);
    setLoading(false);
    setModalVisible(true);
  };

  const handlePermissionChange = (checkedValues: any) => {
    setSelectedPermissionIds(checkedValues);
  };

  const handleBindPermissions = () => {
    if (selectedRoleId !== null) {
      updateRolePermissions({
        resource: `role/bind-permissions`,
        values: {
          permission_ids: selectedPermissionIds,
        },
        id: selectedRoleId,
      });
    }
    setModalVisible(false);
    setSelectedPermissionIds([]);
  };

  const fetchBoundPermissions = async (roleId: number) => {
    try {
      const response = await axiosInstance.get(`/role/bind-permissions/${roleId}`);
      return response.data as number[];
    } catch (error) {
      console.error("获取绑定权限失败", error);
      return [];
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPermissionIds([]);
    setSelectedRoleId(null);
    setBoundIds([]);
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="code"
          title={t("role.fields.code")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("role.fields.code")}
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
            (filters.find((f) => f.field === "code")?.value as string[]) || null
          }
        />
        <Table.Column
          dataIndex="name"
          title={t("role.fields.name")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("role.fields.name")}
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
            (filters.find((f) => f.field === "name")?.value as string[]) || null
          }
        />
        <Table.Column dataIndex="description" title={t("role.fields.description")} />
        <Table.Column
          dataIndex="data_scope"
          title={t("role.fields.data_scope")}
          render={(value: number) =>
            value === 0
              ? t("role.enums.data_scope.all")
              : t("role.enums.data_scope.custom")
          }
        />
        <Table.Column dataIndex="create_time" title={t("common.fields.create_time")} />
        <Table.Column
          title={t("common.actions")}
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} disabled={record.id == 1} />
              <ShowButton recordItemId={record.id} />
              <Button
                onClick={() => openPermissionModal(record.id)}
                disabled={record.id == 1}
              >
                {t("role.actions.bind_permissions")}
              </Button>
            </Space>
          )}
        />
      </Table>

      <Modal
        title={t("role.titles.bind_permissions")}
        open={modalVisible}
        onOk={handleBindPermissions}
        onCancel={closeModal}
        okText={t("common.actions.confirm")}
        cancelText={t("common.actions.cancel")}
      >
        <Checkbox.Group
          style={{ width: "100%" }}
          onChange={handlePermissionChange}
          value={selectedPermissionIds}
        >
          <Space direction="vertical">
            {permissionData?.data.map((perm: any) => (
              <Checkbox key={perm.id} value={perm.id}>
                {perm.name}（{perm.code}）
              </Checkbox>
            ))}
          </Space>
        </Checkbox.Group>
      </Modal>
    </List>
  );
};
