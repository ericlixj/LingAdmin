import React, { useState } from "react";
import { Show, useTable, CreateButton, FilterDropdown } from "@refinedev/antd";
import { useShow, useDelete } from "@refinedev/core";
import {
  Typography,
  Divider,
  Modal,
  Table,
  Input,
  Select,
  DatePicker,
  Space,
  Button,
  Popconfirm,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { SysDicData001 } from "./components/sysDicData001";

const { Text, Title } = Typography;

export const SysDic001Show = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { tableProps, filters, setFilters } = useTable({
    resource: "sysDicData001",
    syncWithLocation: false,
    pagination: { pageSize: 10 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "sys_dic_id",
          operator: "eq",
          value: record?.id,
        },
      ],
    },
    queryOptions: {
      enabled: !!record?.id,
    },
  });

  const onCreateSuccess = () => {
    setModalVisible(false);
  };

  const onEditSuccess = () => {
    setEditModalVisible(false);
    setEditRecord(null);
  };

  const deleteMutation = useDelete();
  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({
        resource: "sysDicData001",
        id,
      });
      message.success("删除成功");
      tableProps.pagination?.onChange?.(
        tableProps.pagination.current,
        tableProps.pagination.pageSize
      );
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <Show isLoading={isLoading}>
      {/* 主表字段渲染 */}
      <Text strong>字段编码:</Text>
      <Text>
        {
          record?.dic_code
        }
      </Text>
      <br />
      <Text strong>字典名称:</Text>
      <Text>
        {
          record?.dic_name
        }
      </Text>
      <br />
      <Text strong>状态:</Text>
      <Text>
        {
          [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}].find(opt => opt.value === record?.status)?.label || record?.status
        }
      </Text>
      <br />
      <Text strong>备注:</Text>
      <Text>
        {
          record?.remark
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        系统字典数据001
        <CreateButton style={{ float: "right" }} onClick={() => setModalVisible(true)}>
          新增系统字典数据001
        </CreateButton>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>
        <Table.Column
          dataIndex="label"
          title="字典标签"
sorter          filteredValue={
            (filters.find((f) => f.field === "label")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索字典标签"
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="value"
          title="字典键值"
sorter          filteredValue={
            (filters.find((f) => f.field === "value")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索字典键值"
                value={(props.selectedKeys[0] as string) || ""}
                onChange={(e) =>
                  props.setSelectedKeys(e.target.value ? [e.target.value] : [])
                }
                onPressEnter={() => props.confirm()}
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="status"
          title="状态"
sorter          filteredValue={
            (filters.find((f) => f.field === "status")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择状态"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}]
                }
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          render={(value) => {
            const values = String(value).split(",");
            const labels = values.map((v) =>
              [{"label": "\u5f00\u542f", "value": 0}, {"label": "\u5173\u95ed", "value": 1}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="orderby"
          title="展示排序号【正序】"
sorter        />
        <Table.Column
          dataIndex="remark"
          title="备注"
        />

        {/* 操作列 */}
        <Table.Column
          title="操作"
          key="actions"
          render={(_, record) => (
            <Space>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditRecord(record);
                  setEditModalVisible(true);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定删除此项吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          )}
        />
      </Table>

      {/* 新增弹窗 */}
      <Modal
        title="新增系统字典数据001"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <SysDicData001
            sys_dic_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑系统字典数据001"
        open={editModalVisible}
        footer={null}
        onCancel={() => {
          setEditModalVisible(false);
          setEditRecord(null);
        }}
        destroyOnClose
        width={600}
      >
        {record?.id && editRecord && (
          <SysDicData001
            sys_dic_id={Number(record.id)}
            initialValues={editRecord}
            isEdit={true}
            onSuccess={onEditSuccess}
            onCancel={() => {
              setEditModalVisible(false);
              setEditRecord(null);
            }}
          />
        )}
      </Modal>
    </Show>
  );
};