import React, { useMemo, useState } from "react";
import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table } from "antd";
import type { Key } from "react";
import "./menu-list.css"; // 用于自定义样式

export const MenuList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
    sorters: {
      mode: "server",
      initial: [
        {
          field: "id",
          order: "asc",
        },
      ],
    },    
    pagination: {
      current: 1,
      pageSize: 1000,
    },
  });

  const [expandedRowKeys, setExpandedRowKeys] = useState<Key[]>([]);

  const treeData = useMemo(
    () => buildTree(tableProps.dataSource || [], 0),
    [tableProps.dataSource]
  );

  const handleRowClick = (record: any) => {
    const key = record.id;
    setExpandedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <List>
      <Table
        rowKey="id"
        dataSource={treeData}
        pagination={false}
        loading={tableProps.loading}
        expandable={{
          expandedRowKeys,
          onExpand: (expanded, record) => {
            handleRowClick(record); // 防止手动展开按钮失效
          },
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
        rowClassName={(record) =>
          record.parent_id === 0 || record.parent_id === null
            ? "menu-row-parent"
            : "menu-row-child"
        }
      >
        {/* 你的各列配置 */}
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="parent_id" title="父ID" />
        <Table.Column dataIndex="name" title="菜单名称"  />
        <Table.Column dataIndex="code" title="编码"  />
        <Table.Column dataIndex="icon" title="图标" />
        <Table.Column dataIndex="type" title="类型"  />
        <Table.Column dataIndex="order_by" title="排序号"  />
        <Table.Column dataIndex="status" title="状态"  />
        <Table.Column dataIndex="modual_name" title="模块名称"  />
        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

// 构建树结构
function buildTree(data: any[], parentId: number | null = null): any[] {
  return data
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      key: item.id,
      children: buildTree(data, item.id),
    }));
}
