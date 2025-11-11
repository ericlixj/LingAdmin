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
  Image,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { FlyerDetails } from "./components/flyerDetails";

const { Text, Title } = Typography;

export const FlyerMainShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;
  console.log("record:", record);

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { tableProps, filters, setFilters } = useTable({
    resource: "flyerDetails",
    syncWithLocation: false,
    pagination: { pageSize: 10 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "flyer_id",
          operator: "eq",
          value: record?.fly_id,
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
        resource: "flyerDetails",
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
      <Text strong>商家id:</Text>
      <Text>
        {
          record?.merchant_id
        }
      </Text>
      <br />
      <Text strong>传单名称:</Text>
      <Text>
        {
          record?.name
        }
      </Text>
      <br />
      <Text strong>开始有效期:</Text>
      <Text>
        {
          record?.valid_from ? dayjs(record.valid_from).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
      <Text strong>结束有效期:</Text>
      <Text>
        {
          record?.valid_to ? dayjs(record.valid_to).format("YYYY-MM-DD") : ""
        }
      </Text>
      <br />
      <Text strong>分类JSON:</Text>
      <Text>
        {
          record?.categories
        }
      </Text>
      <br />
      <Text strong>传单ID:</Text>
      <Text>
        {
          record?.fly_id
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        传单明细
        <CreateButton style={{ float: "right" }} onClick={() => setModalVisible(true)}>
          新增传单明细
        </CreateButton>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>
        <Table.Column
          dataIndex="item_id"
          title="ItemID"
          filteredValue={
            (filters.find((f) => f.field === "item_id")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索ItemID"
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
          dataIndex="name"
          title="名称"
          filteredValue={
            (filters.find((f) => f.field === "name")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索名称"
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
          dataIndex="brand"
          title="品牌"
        />
        <Table.Column
          dataIndex="price"
          title="价格"
        />
        <Table.Column
          dataIndex="cutout_image_url"
          title="传单中商品图片"
          render={(value: string) =>
            value ? (
              <Image
                src={value}
                width={125}
                height={125}
                style={{ objectFit: "contain" }}
                preview={{ mask: <span>点击查看大图</span> }}
              />
            ) : null
          }
        />
        <Table.Column
          dataIndex="valid_from"
          title="开始有效期"
          render={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : "")}
        />
        <Table.Column
          dataIndex="valid_to"
          title="结束有效期"
          render={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : "")}
        />
        <Table.Column
          dataIndex="available_to"
          title="截至有效期"
          render={(value) => (value ? dayjs(value).format("YYYY-MM-DD") : "")}
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
        title="新增传单明细"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <FlyerDetails
            flyer_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑传单明细"
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
          <FlyerDetails
            flyer_id={Number(record.id)}
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