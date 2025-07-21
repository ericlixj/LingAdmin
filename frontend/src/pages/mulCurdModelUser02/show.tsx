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
import { MulCurdModelOrder02 } from "./components/mulCurdModelOrder02";

const { Text, Title } = Typography;

export const MulCurdModelUser02Show = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { tableProps, filters, setFilters } = useTable({
    resource: "mulCurdModelOrder02",
    syncWithLocation: false,
    pagination: { pageSize: 5 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "user_id",
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
        resource: "mulCurdModelOrder02",
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
      <Text strong>用户名称:</Text>
      <Text>
        {
          record?.user_name
        }
      </Text>
      <br />
      <Text strong>用户编码:</Text>
      <Text>
        {
          record?.user_code
        }
      </Text>
      <br />
      <Text strong>开启日期:</Text>
      <Text>
        {
          record?.open_date ? dayjs(record.open_date).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
      <Text strong>用户状态:</Text>
      <Text>
        {
          [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}].find(opt => opt.value === record?.user_status)?.label || record?.user_status
        }
      </Text>
      <br />
      <Text strong>开启功能:</Text>
      <Text>
        {
          (record?.open_function || "")
            .split(",")
            .map(val =>
              [{"label": "\u529f\u80fdA", "value": 1}, {"label": "\u529f\u80fdB", "value": 2}, {"label": "\u529f\u80fdC", "value": 3}].find(opt => opt.value == val || opt.value == Number(val))?.label
            )
            .filter(Boolean)
            .join(", ")
        }
      </Text>
      <br />
      <Text strong>用户信息:</Text>
      <Text>
        {
          record?.user_info
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        主子表模型02订单管理
        <CreateButton style={{ float: "right" }} onClick={() => setModalVisible(true)}>
          新增主子表模型02订单管理
        </CreateButton>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>
        <Table.Column
          dataIndex="id"
          title="主键"
        />
        <Table.Column
          dataIndex="user_id"
          title="关联用户ID"
sorter          filteredValue={
            (filters.find((f) => f.field === "user_id")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索关联用户ID"
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
          dataIndex="order_code"
          title="订单编码"
sorter          filteredValue={
            (filters.find((f) => f.field === "order_code")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索订单编码"
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
          dataIndex="open_date"
          title="开启日期"
sorter          filteredValue={
            (filters.find((f) => f.field === "open_date")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <DatePicker.RangePicker
                style={{ width: "100%" }}                value={props.selectedKeys[0]}
                onChange={(dates) => {
                  props.setSelectedKeys(dates ? [dates] : []);
                }}
                onOk={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          render={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : "")}
        />
        <Table.Column
          dataIndex="order_status"
          title="订单状态"
sorter          filteredValue={
            (filters.find((f) => f.field === "order_status")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择订单状态"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}]
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
              [{"label": "\u542f\u7528", "value": "enabled"}, {"label": "\u505c\u7528", "value": "disabled"}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="open_function"
          title="开启功能"
          render={(value) => {
            const values = String(value).split(",");
            const labels = values.map((v) =>
              [{"label": "\u529f\u80fdA", "value": 1}, {"label": "\u529f\u80fdB", "value": 2}, {"label": "\u529f\u80fdC", "value": 3}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
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
        title="新增主子表模型02订单管理"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <MulCurdModelOrder02
            user_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑主子表模型02订单管理"
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
          <MulCurdModelOrder02
            user_id={Number(record.id)}
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