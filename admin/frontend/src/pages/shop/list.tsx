import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Space, Table } from "antd";
import { useEffect, useState } from "react";
import dataProvider from "../../dataProvider";

export const ShopList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });


  const [appMap, setAppMap] = useState<Record<string, string>>({});

  useEffect(() => {
    dataProvider
      .getList({
        resource: "app",
        pagination: { pageSize: 100, current: 1 }, // 可调整
      })
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data.forEach((item: any) => {
          map[item.code] = item.name;
        });
        setAppMap(map);
      });
  }, [dataProvider]);

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="code"
          title="店铺编码"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索店铺编码"
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
          title="店铺名称"
          sorter
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索店铺名称"
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

        <Table.Column
          dataIndex="app_code"
          title="应用"
          render={(value: string) => appMap[value] || value}
        />

        <Table.Column dataIndex="description" title="描述" />
        <Table.Column dataIndex="create_time" title="创建时间" />

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
