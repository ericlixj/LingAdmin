import React, { useState } from "react";
import { Show, useTable, CreateButton, FilterDropdown } from "@refinedev/antd";
import { useShow, useDelete } from "@refinedev/core";
import { Typography, Divider, Modal, Table, Input, Select, DatePicker, Space, Button, Popconfirm, message  } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { MulCurdModelOrder } from "./components/mulCurdModelOrder";

const { Text, Title } = Typography;

export const MulCurdModelUserShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  // 新增弹窗控制
  const [modalVisible, setModalVisible] = useState(false);
  // 编辑弹窗控制及编辑订单数据
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  // 订单列表表格 hooks，过滤 user_id
  const { tableProps, filters, setFilters } = useTable({
    resource: "mulCurdModelOrder",
    syncWithLocation: false,
    pagination: {
      pageSize: 5,
    },
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

  // 新增成功回调
  const onCreateSuccess = () => {
    setModalVisible(false);
    // 可以考虑调用 tableProps.pagination?.onChange() 或 useTable 的 refetch 方法
  };

  // 编辑成功回调
  const onEditSuccess = () => {
    setEditModalVisible(false);
    setEditRecord(null);
    // 同样可触发表格刷新
  };

  const deleteMutation = useDelete();

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({
        resource: "mulCurdModelOrder",
        id,
      });
      message.success("删除成功");
      // 刷新表格
      tableProps.pagination?.onChange?.(tableProps.pagination.current, tableProps.pagination.pageSize);
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <Show isLoading={isLoading}>
      {/* 用户详情信息 */}
      <Text strong>主键:</Text> <Text>{record?.id}</Text>
      <br />
      <Text strong>用户名称:</Text> <Text>{record?.user_name}</Text>
      <br />
      <Text strong>用户编码:</Text> <Text>{record?.user_code}</Text>
      <br />
      <Text strong>开启日期:</Text>
      <Text>{record?.open_date ? dayjs(record.open_date).format("YYYY-MM-DD") : ""}</Text>
      <br />
      <Text strong>用户状态:</Text>
      <Text>
        {[{ label: "启用", value: "enabled" }, { label: "停用", value: "disabled" }]
          .find((opt) => opt.value === record?.user_status)?.label || record?.user_status}
      </Text>
      <br />
      <Text strong>开启功能:</Text>
      <Text>
        {(record?.open_function || "")
          .split(",")
          .map((val) =>
            [{ label: "功能A", value: 1 }, { label: "功能B", value: 2 }, { label: "功能C", value: 3 }]
              .find((opt) => opt.value == val || opt.value == Number(val))?.label
          )
          .filter(Boolean)
          .join(", ")}
      </Text>
      <br />
      <Text strong>用户信息:</Text> <Text>{record?.user_info}</Text>
      <br />

      <Divider />

      {/* 订单列表标题和新增按钮 */}
      <Title level={5} style={{ marginBottom: 16 }}>
        订单列表
        <CreateButton
          style={{ float: "right" }}
          onClick={() => setModalVisible(true)}
        >
          新增订单
        </CreateButton>
      </Title>

      {/* 订单表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination} >
        <Table.Column dataIndex="id" title="ID" sorter />
        {/* 订单编码筛选 */}
        <Table.Column
          dataIndex="order_code"
          title="订单编码"
          sorter
          filteredValue={
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

        {/* 开启日期筛选 */}
        <Table.Column
          dataIndex="open_date"
          title="开启日期"
          sorter
          filteredValue={
            (filters.find((f) => f.field === "open_date")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                value={props.selectedKeys[0]}
                onChange={(dates) => {
                  props.setSelectedKeys(dates ? [dates] : []);
                }}
                onOk={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          render={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : "")}
        />

        {/* 订单状态筛选 */}
        <Table.Column
          dataIndex="order_status"
          title="订单状态"
          sorter
          filteredValue={
            (filters.find((f) => f.field === "order_status")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择订单状态"
                style={{ minWidth: 150 }}
                options={[
                  { label: "启用", value: "enabled" },
                  { label: "停用", value: "disabled" },
                ]}
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          render={(value) => {
            const option = [
              { label: "启用", value: "enabled" },
              { label: "停用", value: "disabled" },
            ].find((opt) => opt.value === value);
            return option ? option.label : value;
          }}
        />

        <Table.Column
          dataIndex="open_function"
          title="开启功能"
          render={(value) => {
            if (!value) return "";
            const values = Array.isArray(value) ? value : String(value).split(",");
            const labels = values.map((v) => {
              const opt = [
                { label: "功能A", value: 1 },
                { label: "功能B", value: 2 },
                { label: "功能C", value: 3 },
              ].find((o) => String(o.value) === String(v).trim());
              return opt ? opt.label : v;
            });
            return labels.join(", ");
          }}
        />

        <Table.Column dataIndex="order_info" title="订单信息" />

        {/* 操作列，编辑按钮 */}
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
                title="确定删除此订单吗？"
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

      {/* 新增订单弹窗 */}
      <Modal
        title="新增订单"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <MulCurdModelOrder
            userId={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑订单弹窗 */}
      <Modal
        title="编辑订单"
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
          <MulCurdModelOrder
            userId={Number(record.id)}
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
