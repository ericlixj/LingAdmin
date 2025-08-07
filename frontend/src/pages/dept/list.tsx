import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, Button } from "antd";
import styles from "./dept.module.css";
import React, { useEffect, useState, useMemo } from "react";
import { useGo } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";


export const DeptList = () => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const go = useGo();
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server", 
    },
    pagination: {
      current: 1,
      pageSize: 1000, 
    },
  });
  const { selectProps: leaderUserSelectProps } = useSelect({
    resource: "user/list_all_active_users",
    optionLabel: "full_name",
    optionValue: "id",
    sorters: [{ field: "id", order: "asc" }],
    pagination: { current: 1, pageSize: 1000 },
  });

  const leaderUserOptions = leaderUserSelectProps.options ?? [];

  // 工具函数：将扁平结构转为树形结构
  const buildTree = (items: any[]) => {
    const map = new Map();
    const roots: any[] = [];

    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });

    items.forEach((item) => {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children.push(map.get(item.id));
      } else {
        roots.push(map.get(item.id));
      }
    });

    return roots;
  };

const treeData = useMemo(() => buildTree(tableProps.dataSource ?? []), [
  tableProps.dataSource,
]);

useEffect(() => {
  if (!tableProps.loading && treeData.length > 0) {
    const allKeys: React.Key[] = [];
    const collectKeys = (nodes: any[]) => {
      nodes.forEach((node) => {
        allKeys.push(node.id);
        if (node.children?.length) {
          collectKeys(node.children);
        }
      });
    };
    collectKeys(treeData);
    setExpandedRowKeys(allKeys);
  }
}, [tableProps.loading, treeData]);

  return (
    <List>
      <Table
        {...tableProps}
        dataSource={treeData}
        rowKey="id"
        expandable={{
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
        }}
        rowClassName={(record) => {
          return record.children && record.children.length > 0
            ? styles["non-leaf-row"]
            : styles["leaf-row"];
        }}        
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="parent_id" title="父ID" />


        <Table.Column
          dataIndex="dept_name"
          title="部门名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索部门名称"
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
            (filters.find((f) => f.field === "dept_name")?.value as any[]) ||
            null
          }
        />

        <Table.Column
          dataIndex="dept_code"
          title="部门编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索部门编码"
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
            (filters.find((f) => f.field === "dept_code")?.value as any[]) ||
            null
          }
        />
        <Table.Column dataIndex="orderby" title="排序号" />

        <Table.Column
          dataIndex="leader_user_id"
          title="负责人"
          render={(value) => {
            // value 是数字，直接找
            const user = leaderUserOptions.find(u => Number(u.value) === Number(value));
            return user?.label ?? value ?? "-";
          }}
          filterDropdown={(props) => {
            // FIXME 无法展示label
            const selectedId = (props.selectedKeys && props.selectedKeys.length > 0) ? props.selectedKeys[0] : undefined;
            const selectedIdNumber = selectedId !== undefined ? Number(selectedId) : undefined;
            return (
              <FilterDropdown {...props}>
                <Select
                  allowClear
                  placeholder="请选择负责人"
                  value={leaderUserOptions.length ? selectedIdNumber : undefined}
                  style={{ minWidth: 150 }}
                  showSearch
                  loading={!leaderUserSelectProps.options?.length}
                  optionLabelProp="label"
                  onChange={(value) => {
                    props.setSelectedKeys(value !== undefined ? [value] : []);
                    props.confirm();
                  }}
                >
                  {leaderUserOptions.map(opt => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Select.Option>
                  ))}
                </Select>
              </FilterDropdown>
            );
          }}
          filteredValue={
            (() => {
              const raw = filters.find(f => f.field === "leader_user_id")?.value;
              if (Array.isArray(raw)) {
                // 直接返回数字数组
                return raw;
              } else if (raw !== undefined) {
                return [raw];
              }
              return [];
            })()
          }
        />

        <Table.Column
          dataIndex="status"
          title="状态"
          filterDropdown={(props) => (
            // FIXME 无法展示label
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择状态"
                style={{ minWidth: 150 }}
                value={props.selectedKeys?.[0] !== undefined ? Number(props.selectedKeys[0]) : undefined}
                optionLabelProp="label"
                onChange={(value) => {
                  props.setSelectedKeys(value !== undefined ? [value] : []);
                  props.confirm();
                }}
              >
                <Select.Option value={0} label="开启">开启</Select.Option>
                <Select.Option value={1} label="关闭">关闭</Select.Option>
              </Select>
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "status")?.value as any[]) || null
          }
          render={(value) => {
            const option = [
              { label: "开启", value: 0 },
              { label: "关闭", value: 1 },
            ].find((opt) => opt.value === value);
            return option ? option.label : value;
          }}
        />


        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} disabled={record.id === 0}/>
              <ShowButton recordItemId={record.id} disabled={record.id === 0}/>
              <Button
                type="link"
                onClick={(e) => {
                  e.stopPropagation(); // 避免触发行点击
                  go({
                    to: `/dept/create?parent_id=${record.id}`,
                    type: "push",
                  });
                }}
              >
                新建
              </Button>              
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
