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
import { Tree } from "antd";
import { useMenuData } from "../../hooks/userMenuData";
import { useMemo } from "react";

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
  const { data: permissionData } = useMenuData();
  const { mutate: updateRolePermissions } = useUpdate();
  const [boundIds, setBoundIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const getLeafNodeIds = (ids: number[], list: any[]): number[] => {
    const parentIdSet = new Set(list.map((item) => item.parent_id).filter(Boolean));
    return ids.filter((id) => !parentIdSet.has(id) && id !== 0);
  };

  const openPermissionModal = async (roleId: number) => {
    setSelectedRoleId(roleId);
    setLoading(true);
    const ids = await fetchBoundPermissions(roleId);
    setBoundIds(ids);
    // 只选中叶子节点用于回显
    console.info("已绑定的权限 ID 列表：", ids);
    const leafIds = getLeafNodeIds(ids, permissionData?.data || []);
    console.info("叶子节点 ID 列表：", leafIds);
    setSelectedPermissionIds(leafIds);
    setLoading(false);
    setModalVisible(true);
  };

  const collectWithAncestors = (selectedIds: number[]): number[] => {
    console.info("parentMap", parentMap);
    const resultSet = new Set<number>();
    const addWithParents = (id: number) => {
      if (resultSet.has(id)) return;
      resultSet.add(id);

      const parentId = parentMap.get(id);
      if (parentId != null) {
        addWithParents(parentId);
      }
    };

    selectedIds.forEach((id) => addWithParents(id));

    return Array.from(resultSet);
  };

  const handleBindPermissions = () => {
    if (selectedRoleId !== null) {
      console.log("🔗 正在提交绑定的权限 ID 列表：", selectedPermissionIds);
      const allIdsToSave = collectWithAncestors(selectedPermissionIds);
      console.info("所有选中权限及其祖先 ID 列表：", allIdsToSave);
      updateRolePermissions({
        resource: `role/bind-permissions`,
        values: {
          permission_ids: allIdsToSave,
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

  const { treeData, parentMap } = useMemo(() => {
  const parentMap = new Map<number, number | null>();
  const list = permissionData?.data || [];

  const map = new Map<number, any>();
  const tree: any[] = [];

  list.forEach((item) => {
    map.set(item.id, {
      ...item,
      key: item.id,
      title: `${item.menu_label}（${item.permission_code}）`,
      children: [],
    });
    parentMap.set(item.id, item.parent_id); 
  });

  list.forEach((item) => {
    const node = map.get(item.id);
    const parent = map.get(item.parent_id);
    if (parent) {
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  });

  return { treeData: tree, parentMap }; // 👈 返回
}, [permissionData?.data]);


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
        title={t("role.actions.bind_permissions")}
        open={modalVisible}
        onOk={handleBindPermissions}
        onCancel={closeModal}
        okText={t("common.confirm")}
        cancelText={t("common.cancel")}
      >
        <Tree
          checkable
          defaultExpandAll
          treeData={treeData}
          checkedKeys={selectedPermissionIds}
          onCheck={(checkedKeys) => {
            setSelectedPermissionIds(checkedKeys as number[]);
          }}
        />
      </Modal>
    </List>
  );
};
