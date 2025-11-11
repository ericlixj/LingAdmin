import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker, Button, message, Popconfirm  } from "antd";
import dayjs from "dayjs";
import axiosInstance from "../../utils/axiosInstance";

export const FlyerMainList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <>
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Popconfirm
                title="确定要启动 ALL_IN_ONE 任务吗？此操作可能耗时较长"
                onConfirm={async () => {
                  try {
                    const res = await axiosInstance.post('/flyerMain/scrape_all_in_one');
                    console.info(res);
                    if (res.data.ok) {
                      message.success(res.data.msg);
                    } else {
                      message.error("启动抓取任务失败");
                    }
                  } catch (err) {
                    console.error(err);
                    message.error("请求失败，请稍后重试");
                  }
                }}
                okText="确认"
                cancelText="取消"
              >
                <Button type="primary">
                  启动ALL_IN_ONE任务
                </Button>
              </Popconfirm>
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="merchant_id"
          title="商家id"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索商家id"
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
            (filters.find((f) => f.field === "merchant_id")?.value as any[]) || null
          }
          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="name"
          title="传单名称"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索传单名称"
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
            (filters.find((f) => f.field === "name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="valid_from"
          title="开始有效期"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <DatePicker.RangePicker

                style={{ width: '100%' }}
                value={props.selectedKeys[0]}
                onChange={(dates) => {
                  props.setSelectedKeys(dates ? [dates] : []);
                }}
                onOk={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "valid_from")?.value as any[]) || null
          }

          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />
        <Table.Column
          dataIndex="valid_to"
          title="结束有效期"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <DatePicker.RangePicker

                style={{ width: '100%' }}
                value={props.selectedKeys[0]}
                onChange={(dates) => {
                  props.setSelectedKeys(dates ? [dates] : []);
                }}
                onOk={() => props.confirm()}
              />
            </FilterDropdown>
          )}
          filteredValue={
            (filters.find((f) => f.field === "valid_to")?.value as any[]) || null
          }

          render={(value) => {
            return value ? dayjs(value).format("YYYY-MM-DD") : "";
          }}
        />
        <Table.Column
          dataIndex="categories"
          title="分类JSON"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="fly_id"
          title="传单ID"

          render={(value) => {
            return value;
          }}
        />

        <Table.Column
          title="操作"
          render={(_, record) => (
            <Space>
              <EditButton recordItemId={record.id} />
              <ShowButton recordItemId={record.id} >子表管理</ShowButton>
            </Space>
          )}
        />
      </Table>
    </List>
    </>
  );
};