import {
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { Input, Select, Space, Table, DatePicker, Image, Button, message } from "antd";
import dayjs from "dayjs";
import axiosInstance from "../../utils/axiosInstance";


export const FlyerDetailsList = () => {
  const { tableProps, filters } = useTable({
    syncWithLocation: true,
    filters: {
      mode: "server",
    },
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Button type="primary" 
            onClick={async () => {
            const res = await axiosInstance.post('/flyerDetails/translateNames');
            if (res.data.ok) {
              message.success(res.data.msg);
            } else {
              message.error("服务异常");
            }
          }}
          >
            启动任务-中文翻译
          </Button>
          <Button type="primary" 
            onClick={async () => {
            const res = await axiosInstance.post('/flyerDetails/write_to_es');
            if (res.data.ok) {
              message.success(res.data.msg);
            } else {
              message.error("服务异常");
            }
          }}
          >
            启动任务-写入ES
          </Button>          
        </>
      )}      
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" sorter />

        <Table.Column
          dataIndex="item_id"
          title="ItemID"
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
          filteredValue={
            (filters.find((f) => f.field === "item_id")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="name"
          title="名称"
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
          filteredValue={
            (filters.find((f) => f.field === "name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="cn_name"
          title="名称_简体中文"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索名称_简体中文"
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
            (filters.find((f) => f.field === "cn_name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="hk_name"
          title="名称_繁体中文"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索名称_繁体中文"
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
            (filters.find((f) => f.field === "hk_name")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />        
        <Table.Column
          dataIndex="brand"
          title="品牌"

          render={(value) => {
            return value;
          }}
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
          dataIndex="price"
          title="价格"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索价格"
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
            (filters.find((f) => f.field === "price")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="flyer_id"
          title="传单ID"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索价格"
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
            (filters.find((f) => f.field === "price")?.value as any[]) || null
          }
          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="merchant_id"
          title="商家ID"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索商家ID"
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
          dataIndex="merchant"
          title="商家名"
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input
                placeholder="搜索商家名"
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
            (filters.find((f) => f.field === "merchant")?.value as any[]) || null
          }

          render={(value) => {
            return value;
          }}
        />
<Table.Column
          dataIndex="valid_from"
          title="开始有效期"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="valid_to"
          title="结束有效期"

          render={(value) => {
            return value;
          }}
        />
        <Table.Column
          dataIndex="available_to"
          title="截至有效期"

          render={(value) => {
            return value;
          }}
        />
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