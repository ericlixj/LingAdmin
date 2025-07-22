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
import { CrudDefineFileds } from "./components/crudDefineFileds";

const { Text, Title } = Typography;

export const CrudDefineModuelShow = () => {
  const { queryResult } = useShow();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const { tableProps, filters, setFilters } = useTable({
    resource: "crudDefineFileds",
    syncWithLocation: false,
    pagination: { pageSize: 10 },
    filters: {
      mode: "server",
      permanent: [
        {
          field: "module_id",
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
        resource: "crudDefineFileds",
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
      <Text strong>模块名称:</Text>
      <Text>
        {
          record?.module_name
        }
      </Text>
      <br />
      <Text strong>模块标识:</Text>
      <Text>
        {
          record?.label
        }
      </Text>
      <br />
      <Text strong>描述信息:</Text>
      <Text>
        {
          record?.description
        }
      </Text>
      <br />

      <Divider />

      {/* 子表标题和新增按钮 */}

      <Title level={5} style={{ marginBottom: 16 }}>
        CRUD字段定义
        <CreateButton style={{ float: "right" }} onClick={() => setModalVisible(true)}>
          新增CRUD字段定义
        </CreateButton>
      </Title>

      {/* 子表表格 */}
      <Table {...tableProps} rowKey="id" pagination={tableProps.pagination}>
        <Table.Column
          dataIndex="name"
          title="字段名"
sorter          filteredValue={
            (filters.find((f) => f.field === "name")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索字段名"
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
          dataIndex="type"
          title="字段类型"
sorter          filteredValue={
            (filters.find((f) => f.field === "type")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择字段类型"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u5b57\u7b26\u4e32", "value": "str"}, {"label": "\u6574\u6570", "value": "int"}, {"label": "\u65e5\u671f", "value": "datetime"}]
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
              [{"label": "\u5b57\u7b26\u4e32", "value": "str"}, {"label": "\u6574\u6570", "value": "int"}, {"label": "\u65e5\u671f", "value": "datetime"}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="primary_key"
          title="是否为主键"
sorter          filteredValue={
            (filters.find((f) => f.field === "primary_key")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否为主键"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="description"
          title="描述"
sorter          filteredValue={
            (filters.find((f) => f.field === "description")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索描述"
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
          dataIndex="form_type"
          title="表单类型"
sorter          filteredValue={
            (filters.find((f) => f.field === "form_type")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择表单类型"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u6587\u672c\u6846", "value": "text"}, {"label": "\u6587\u672c\u5757", "value": "textarea"}, {"label": "\u590d\u9009\u6846", "value": "checkbox"}, {"label": "\u4e0b\u62c9\u6846", "value": "select"}, {"label": "\u65e5\u671f\u9009\u62e9\u6846", "value": "date"}]
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
              [{"label": "\u6587\u672c\u6846", "value": "text"}, {"label": "\u6587\u672c\u5757", "value": "textarea"}, {"label": "\u590d\u9009\u6846", "value": "checkbox"}, {"label": "\u4e0b\u62c9\u6846", "value": "select"}, {"label": "\u65e5\u671f\u9009\u62e9\u6846", "value": "date"}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="options"
          title="备选值"
sorter          filteredValue={
            (filters.find((f) => f.field === "options")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索备选值"
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
          dataIndex="max_length"
          title="最大长度"
sorter          filteredValue={
            (filters.find((f) => f.field === "max_length")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索最大长度"
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
          dataIndex="default"
          title="默认值"
sorter          filteredValue={
            (filters.find((f) => f.field === "default")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索默认值"
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
          dataIndex="required"
          title="是否必填"
sorter          filteredValue={
            (filters.find((f) => f.field === "required")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否必填"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="insertable"
          title="是否可插入"
sorter          filteredValue={
            (filters.find((f) => f.field === "insertable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可插入"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="updatable"
          title="是否可更新"
sorter          filteredValue={
            (filters.find((f) => f.field === "updatable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可更新"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="listable"
          title="是否可列表"
sorter          filteredValue={
            (filters.find((f) => f.field === "listable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可列表"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="queryable"
          title="是否可查询"
sorter          filteredValue={
            (filters.find((f) => f.field === "queryable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可查询"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="query_type"
          title="查询类型"
sorter          filteredValue={
            (filters.find((f) => f.field === "query_type")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择查询类型"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u7b49\u4e8e", "value": "eq"}, {"label": "\u5305\u542b", "value": "like"}, {"label": "\u5728\u8303\u56f4\u5185", "value": "in"}]
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
              [{"label": "\u7b49\u4e8e", "value": "eq"}, {"label": "\u5305\u542b", "value": "like"}, {"label": "\u5728\u8303\u56f4\u5185", "value": "in"}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="sortable"
          title="是否可排序"
sorter          filteredValue={
            (filters.find((f) => f.field === "sortable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可排序"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="nullable"
          title="是否可为空"
sorter          filteredValue={
            (filters.find((f) => f.field === "nullable")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否可为空"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="unique"
          title="是否建立唯一索引"
sorter          filteredValue={
            (filters.find((f) => f.field === "unique")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否建立唯一索引"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
            );
            return labels.join(", ");
          }}
        />
        <Table.Column
          dataIndex="index"
          title="是否建立索引"
sorter          filteredValue={
            (filters.find((f) => f.field === "index")?.value as any[]) || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder="请选择是否建立索引"
                style={{ minWidth: 150 }}                options={
                  [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}]
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
              [{"label": "\u662f", "value": true}, {"label": "\u5426", "value": false}].find((o) => String(o.value) === v)?.label || v
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
        title="新增CRUD字段定义"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        {record?.id && (
          <CrudDefineFileds
            module_id={Number(record.id)}
            onSuccess={onCreateSuccess}
            onCancel={() => setModalVisible(false)}
          />
        )}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑CRUD字段定义"
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
          <CrudDefineFileds
            module_id={Number(record.id)}
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