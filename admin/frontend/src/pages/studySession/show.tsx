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
import { StudySessionItem } from "./components/studySessionItem";

const { Text, Title } = Typography;

export const StudySessionShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { tableProps, filters, setFilters } = useTable({
    resource: "studySessionItem",
    syncWithLocation: false,
    pagination: { pageSize: 10 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "session_id",
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
        resource: "studySessionItem",
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
      <Text strong>user_id:</Text>
      <Text>
        {
          record?.user_id
        }
      </Text>
      <br />
      <Text strong>exam_id:</Text>
      <Text>
        {
          record?.exam_id
        }
      </Text>
      <br />
      <Text strong>学习模式:</Text>
      <Text>
        {
          [{"label": "\u8003\u8bd5", "value": "exam"}, {"label": "\u7ec3\u4e60", "value": "practice"}, {"label": "\u590d\u4e60", "value": "review"}, {"label": "FlashCard", "value": "flashcard"}].find(opt => opt.value === record?.mode)?.label || record?.mode
        }
      </Text>
      <br />
      <Text strong>start_time:</Text>
      <Text>
        {
          record?.start_time
        }
      </Text>
      <br />
      <Text strong>end_time:</Text>
      <Text>
        {
          record?.end_time
        }
      </Text>
      <br />
      <Text strong>score:</Text>
      <Text>
        {
          record?.score
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        学习记录明细
        <CreateButton style={{ float: "right" }} onClick={() => setModalVisible(true)}>
          新增学习记录明细
        </CreateButton>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>

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
        title="新增学习记录明细"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <StudySessionItem
            session_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑学习记录明细"
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
          <StudySessionItem
            session_id={Number(record.id)}
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