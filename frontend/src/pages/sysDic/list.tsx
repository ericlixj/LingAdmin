import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table } from "antd";
import { useTranslate } from "@refinedev/core";

export const SysDicList = () => {
  const t = useTranslate();
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="dic_code"
          title={t("sysDic.fields.dic_code")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("sysDic.placeholders.dic_code")}
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
            (filters.find((f) => f.field === "dic_code")?.value as any[]) || null
          }
        />

        <Table.Column
          dataIndex="dic_name"
          title={t("sysDic.fields.dic_name")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder={t("sysDic.placeholders.dic_name")}
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
            (filters.find((f) => f.field === "dic_name")?.value as any[]) || null
          }
        />

        <Table.Column
          dataIndex="status"
          title={t("sysDic.fields.status")}
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                allowClear
                showSearch
                placeholder={t("sysDic.placeholders.status")}
                style={{ minWidth: 150 }}
                options={[
                  { label: t("common.options.enabled"), value: 0 },
                  { label: t("common.options.disabled"), value: 1 },
                ]}
                value={props.selectedKeys[0]}
                onChange={(value) =>
                  props.setSelectedKeys(value ? [value] : [])
                }
                onBlur={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "status")?.value as any[]) || null
          }
          render={(value) => {
            const option = [
              { label: t("common.options.enabled"), value: 0 },
              { label: t("common.options.disabled"), value: 1 },
            ].find((opt) => opt.value === value);
            return option ? option.label : value;
          }}
        />

        <Table.Column
          dataIndex="remark"
          title={t("sysDic.fields.remark")}
        />

        <Table.Column
          title={t("common.actions")}
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id}>
                {t("sysDic.actions.manage_children")}
              </ShowButton>
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
