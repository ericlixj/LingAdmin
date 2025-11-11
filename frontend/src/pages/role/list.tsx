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
  Select,
  Input,
  Modal,
  Space,
  Table,
} from "antd";
import { useState, useMemo } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { Tree } from "antd";
import { useMenuData } from "../../hooks/userMenuData";
import { DeptTreeSelect } from "../../components/common/DeptTreeSelect";

export const RoleList = () => {
  const t = useTranslate();

  const { tableProps, filters, tableQuery } = useTable({
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
    // console.info("parentMap", parentMap);
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
  

  const [dataModalVisible, setDataModalVisible] = useState(false);
  const [selectedDataScope, setSelectedDataScope] = useState<number>(0);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const { data: deptData } = useList({
    resource: "dept",
    meta: { selectAll: true },
    filters: [{ field: "status", operator: "eq", value: 0 }],
  });
  const openDataPermissionModal = async (role: any) => {
    setSelectedRoleId(role.id);
    setSelectedDataScope(role.data_scope);
    setSelectedDeptIds([]);
    
    const res = await axiosInstance.get(`/role/bind-dept/${role.id}`);
    const dept_ids  = res.data as number[] || [];
    console.info("已绑定的部门 ID 列表：", dept_ids);
    if (Array.isArray(dept_ids)) {
      setSelectedDeptIds(dept_ids);
    }

    setDataModalVisible(true);
  };

  const handleBindDataPermissions = async () => {
    const payload = {
      data_scope: selectedDataScope,
      dept_ids: selectedDataScope === 1 ? selectedDeptIds : [],
    };
    // console.info("提交的数据权限范围和部门 ID 列表：", payload);
    await axiosInstance.patch(`/role/bind-data-permissions/${selectedRoleId}`, payload);

    setDataModalVisible(false);
    setSelectedDeptIds([]);
    setSelectedRoleId(null);

    tableQuery.refetch();

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
          render={(value: number) => {
            const scopeMap = {
              0: t("role.enums.data_scope.all"),          // 全部数据权限
              1: t("role.enums.data_scope.custom"),       // 指定部门数据权限
              2: t("role.enums.data_scope.dept_only"),         // 本部门数据权限
              3: t("role.enums.data_scope.dept_and_sub"), // 本部门及以下
              4: t("role.enums.data_scope.self_only"),         // 仅本人数据
            };
            return scopeMap[value] ?? value;
          }}
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
              <Button
                onClick={() => openDataPermissionModal(record)}
                disabled={record.id == 1}
              >
                {t("role.actions.bind_data_permissions")}
              </Button>              
            </Space>
          )}
        />
      </Table>
      
      {/* 菜单权限 */}
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
      
      {/* 数据权限 */}
      <Modal
        title={t("role.actions.bind_data_permissions")}
        open={dataModalVisible}
        onOk={handleBindDataPermissions}
        onCancel={() => setDataModalVisible(false)}
        okText={t("common.confirm")}
        cancelText={t("common.cancel")}
      >
        <div style={{ marginBottom: 16 }}>
          <label>{t("role.fields.data_scope")}</label>
          <Select
            style={{ width: "100%" }}
            value={selectedDataScope}
            onChange={(value) => setSelectedDataScope(value)}
            options={[
              { label: t("role.enums.data_scope.all"), value: 0 },
              { label: t("role.enums.data_scope.custom"), value: 1 },
              { label: t("role.enums.data_scope.dept_only"), value: 2 },
              { label: t("role.enums.data_scope.dept_and_sub"), value: 3 },
              { label: t("role.enums.data_scope.self_only"), value: 4 },
            ]}
          />
        </div>

        {selectedDataScope === 1 && (
          <DeptTreeSelect
            value={selectedDeptIds} 
            onChange={(val) => setSelectedDeptIds(val)}
            multiple={true}
            placeholder="请选择部门"
          />

        )}
      </Modal>      
    </List>
  );
};
