import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList, useUpdate } from "@refinedev/core";
import { Button, Checkbox, Input, Modal, Space, Table, Tag } from "antd";
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

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />

        <Table.Column
          dataIndex="email"
          title="注册邮箱"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search email"
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
          title="全名"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search full name"
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
          dataIndex="is_active"
          title="是否激活"
          render={(value) =>
            value ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>
          }
        />
        <Table.Column dataIndex="create_time" title="创建时间" />
        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton
                recordItemId={record.id}
                disabled={record.is_superuser}
              />
              <ShowButton recordItemId={record.id} />
              <Button onClick={() => openRoleModal(record.id)} disabled={record.is_superuser}>绑定角色</Button>
            </Space>
          )}
        />
      </Table>

      <Modal
        title="绑定角色"
        open={modalVisible}
        onOk={handleBindRoles}
        onCancel={() => setModalVisible(false)}
        okText="绑定"
        cancelText="取消"
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
    </List>
  );
};
