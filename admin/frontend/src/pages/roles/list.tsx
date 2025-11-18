import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { useList, useUpdate } from "@refinedev/core";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Space,
  Table
} from "antd";
import { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

export const RoleList = () => {
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
    updateRolePermissions(
      {
        resource: `role/bind-permissions`,
        values: {
          permission_ids: selectedPermissionIds,
        },
        id: selectedRoleId,
      }
    );
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
          title="角色编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search code"
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
          title="角色名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="Search name"
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
        <Table.Column dataIndex="description" title="角色描述" />
        <Table.Column
          dataIndex="data_scope"
          title="数据范围"
          render={(value: number) =>
            value === 0 ? "全部数据权限" : "自定义数据权限"
          }
        />
        <Table.Column dataIndex="create_time" title="创建时间" />
        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} disabled={record.id==1}/>
              <ShowButton recordItemId={record.id} />
              <Button onClick={() => openPermissionModal(record.id)} disabled={record.id==1}>
                绑定权限
              </Button>
            </Space>
          )}
        />
      </Table>

      <Modal
        title="绑定权限"
        open={modalVisible}
        onOk={handleBindPermissions}
        onCancel={closeModal}
        okText="绑定"
        cancelText="取消"
      >
        <Checkbox.Group style={{ width: "100%" }} onChange={handlePermissionChange} value={selectedPermissionIds}>
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
